/*project*/
function Project(){
	
	//另開視窗
	var win = window.open("", "編輯",config="fullscreen=yes");
	win.document.open("text/html");
	win.document.write('<nav></nav>');
	win.document.write('<canvas id="canvas"></canvas>');
	win.document.close();

	var save = false;

	//預載底圖
	var draw = Draw();
	var winCanvas = win.document.getElementById("canvas");
	var winCanvasCtx = winCanvas.getContext("2d");
	winCanvas.width = draw.img.width;
	winCanvas.height = draw.img.height;

	//預載遮罩
	var maskCanvas = win.document.createElement("canvas");
	var maskCtx = maskCanvas.getContext("2d");
	maskCanvas.width = draw.img.width;
	maskCanvas.height = draw.img.height;

	//預載遮罩框
	var maskBorderCanvas = win.document.createElement("canvas");
	var maskBorderCtx = maskBorderCanvas.getContext("2d");
	maskBorderCanvas.width = draw.img.width;
	maskBorderCanvas.height = draw.img.height;

	//筆刷大小
	var blurSize = 40;

	//模糊程度
	var blurDegree = 3;

	//載入模糊影像
	var blurCanvas = win.document.createElement("canvas");
	var blurCtx = blurCanvas.getContext("2d");
	blurCanvas.width = draw.img.width;
	blurCanvas.height = draw.img.height;
	blurCtx.filter = "blur(" +  blurDegree + "px)";
	blurCtx.drawImage(draw.img,0,0);

	//滑鼠滑入：景深加強
	winCanvas.addEventListener("mousemove",function(event){

		//紀錄滑鼠位置
		var point = {
    		x: event.clientX - winCanvas.offsetLeft,
    		y: event.clientY - winCanvas.offsetTop
  		};
  		
  		//繪製遮罩
  		var drawMask = function(){
	  		maskCtx.clearRect(0, 0, draw.img.width, draw.img.height);
			maskCtx.fillStyle = 'rgb(0,0,0)';
			maskCtx.shadowBlur = 120;
			maskCtx.shadowColor = 'rgb(0,0,0)';
	    	maskCtx.beginPath();
	    	maskCtx.arc(point.x,point.y,blurSize,0,2*Math.PI);
			maskCtx.fill();
		}

		//繪製遮罩框
		var drawMaskBorder = function(){
			maskBorderCtx.clearRect(0, 0, draw.img.width, draw.img.height);
			maskBorderCtx.strokeStyle = 'rgb(50,50,50)';
			maskBorderCtx.lineWidth = 1;
			maskBorderCtx.beginPath();
			maskBorderCtx.arc(point.x,point.y,blurSize,0,2*Math.PI);
	    	maskBorderCtx.stroke();
    	}

  		//繪製
  		var drawing = function(){
	  		winCanvasCtx.clearRect(0, 0, draw.img.width, draw.img.height);
			winCanvasCtx.globalCompositeOperation = 'source-over';
			winCanvasCtx.drawImage(draw.img, 0, 0, draw.img.width, draw.img.height);
			winCanvasCtx.globalCompositeOperation = 'destination-in';
			winCanvasCtx.drawImage(maskCanvas, 0, 0);
			winCanvasCtx.globalCompositeOperation = 'destination-over';
			winCanvasCtx.drawImage(blurCanvas, 0, 0, draw.img.width, draw.img.height);
			winCanvasCtx.globalCompositeOperation = 'source-over';
			winCanvasCtx.drawImage(maskBorderCanvas, 0, 0);
		}

		//按壓
		win.document.addEventListener("keydown",function(event){
			//加號：筆刷放大
			if(event.key == "+"){
				blurSize += 0.05;
			}
			//減號：筆刷縮小
			if(event.key == "-"){
				if(blurSize > 10){
					blurSize -= 0.05;
				}
			}
			//上：模糊放大
			if(event.key == "ArrowUp"){
				blurDegree += 0.001;
			}
			//下：模糊減輕
			if(event.key == "ArrowDown"){
				blurDegree -= 0.001;
			}
			win.console.log(blurDegree);
		});

		//放開按鍵：立即顯示
		win.document.addEventListener("keyup",function(event){
			blurCtx.filter = "blur(" +  blurDegree + "px)";
			blurCtx.drawImage(draw.img,0,0);
			drawMask();
			drawMaskBorder();
			drawing();
		});

		drawMask();
		drawMaskBorder();
		drawing();
		
	}, false);

	//滑鼠點擊：保留
	winCanvas.addEventListener("click",function(event){
        save = true;
        draw.ctx.clearRect(0, 0, draw.img.width, draw.img.height);
		draw.ctx.globalCompositeOperation = 'source-over';
		draw.ctx.drawImage(draw.img, 0, 0, draw.img.width, draw.img.height);
		draw.ctx.globalCompositeOperation = 'destination-in';
		draw.ctx.drawImage(maskCanvas, 0, 0);
		draw.ctx.globalCompositeOperation = 'destination-over';
		draw.ctx.drawImage(blurCanvas, 0, 0, draw.img.width, draw.img.height);
		win.close();

	}, false);

}

/*Sharpen*/
function Sharpen(){
	
	var draw = Draw();

	//讀取圖片資訊RGB
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var output = draw.ctx.createImageData(draw.img.width,draw.img.height);
	var matrix = [  0, -1,  0, -1,  5, -1, 0, -1,  0 ];
	var side = Math.round(Math.sqrt(matrix.length));
  	var halfSide = Math.floor(side/2);
	for (var y=0; y<draw.img.height; y++) {
    	for (var x=0; x<draw.img.width; x++) {
      		var sy = y;
      		var sx = x;
      		var dstOff = (y*draw.img.width+x)*4;
	    	var r=0, g=0, b=0, a=0;
	    	for (var cy=0; cy<side; cy++) {
	        	for (var cx=0; cx<side; cx++) {
	          		var scy = sy + cy - halfSide;
	          		var scx = sx + cx - halfSide;
	          		if (scy >= 0 && scy < draw.img.height && scx >= 0 && scx < draw.img.width) {
	            		var srcOff = (scy*draw.img.width+scx)*4;
            			var wt = matrix[cy*side+cx];
            			r += imgData.data[srcOff] * wt;
            			g += imgData.data[srcOff+1] * wt;
            			b += imgData.data[srcOff+2] * wt;
            			a += imgData.data[srcOff+3] * wt;
	          		}
	        	}
	      	}
	      	output.data[dstOff] = r;
	    	output.data[dstOff+1] = g;
	    	output.data[dstOff+2] = b;
	      	output.data[dstOff+3] = 255;
    	}
    }
    draw.ctx.putImageData(output,0,0);

}

/*HW8 image smooth & edge detection*/
function Smooth(){
	
	//選擇濾鏡
	var filter = new Object();
	filter.name = "";
	filter.size = 0;
	filter.matrix = [];
	var win = window.open("", "選擇濾鏡",config="height=50,width=50");
	win.document.open("text/html");
	win.document.write('<div id="filter">')
	win.document.write('<button type="button" id="gaussian" name="gaussian" style="margin-left:2%;">高斯模糊</button>');
	win.document.write('<button type="button" id="average" name="average" style="margin-left:2%;">平均模糊</button>');
	win.document.write('<button type="button" id="reset" name="reset" style="margin-left:2%;">重置</button>');
	win.document.write('</div>')
	win.document.close();
	
	var draw = Draw();

	//讀取圖片資訊RGB
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);

	var div = win.document.querySelector("div");
	div.addEventListener('click', function(event){
		if (event.target.tagName.toLowerCase() === 'button') {
	    	//建立濾鏡
	    	filter.name = event.target.id;
	    	if(filter.name == "average" || filter.name == "gaussian" ){
	    		if(filter.name == "gaussian"){
	    			draw.ctx.putImageData(imgData,0,0);
				    draw.ctx.filter = "blur(5px)";
				    draw.canvas.style.webkitFilter = "blur(5px)";
				}
				else if(filter.name == "average"){
					draw.ctx.filter = "none";
					draw.canvas.style.webkitFilter = "none";
					filter.size = 3;
					for(var i=0;i<filter.size;i++){
						filter.matrix[i] = new Array(filter.size);
						for(var j=0;j<filter.size;j++){
							filter.matrix[i][j] = 1/9;//平均模糊
						}
					}
					//convolution
					var output = draw.ctx.createImageData(draw.img.width,draw.img.height);
					var half = Math.floor(filter.size / 2);
					for(var y=0;y<draw.img.height-1;y++){
						for(var x=0;x<draw.img.width-1;x++){
							var px = (y * draw.img.width + x) * 4;
							var r = 0, g = 0, b = 0;
							for (var cy = 0; cy < filter.size; cy++){
				       			for (var cx = 0; cx < filter.size; cx++){
				        			var cpx = ((y + (cy - half)) * draw.img.width + (x + (cx - half))) * 4;
				        			r += imgData.data[cpx] * filter.matrix[cy][cx];
				        			g += imgData.data[cpx + 1] * filter.matrix[cy][cx];
				        			b += imgData.data[cpx + 2] * filter.matrix[cy][cx];
				        		}
				        	}
				        	output.data[px] = Math.round(r);
				        	output.data[px + 1] = Math.round(g);
				        	output.data[px + 2] = Math.round(b);
				        	output.data[px + 3] = imgData.data[cpx + 3];
				        }
				    }
				    draw.ctx.putImageData(output,0,0);	
				}
	    	}
	    	else{
	    		draw.ctx.putImageData(imgData,0,0);
	    		draw.ctx.filter = "none";
				draw.canvas.style.webkitFilter = "none";
	    	}
	  	}
	}, true);
}

function Edge(){
	
	//選擇濾鏡
	var filter = new Object();
	filter.name = "";
	filter.size = 0;
	filter.matrix = [];

	var win = window.open("", "選擇濾鏡",config="height=50,width=100");
	win.document.open("text/html");
	win.document.write('<div id="filter">')
	win.document.write('<button type="button" id="laplace" name="laplace" style="margin-left:2%;">Laplace 邊緣偵測</button>');
	win.document.write('<button type="button" id="sobel" name="sobel" style="margin-left:2%;">Sobel 邊緣偵測</button>');
	win.document.write('<button type="button" id="reset" name="reset" style="margin-left:2%;">重置</button>');
	win.document.write('</div>')
	win.document.close();
	
	var draw = Draw();

	//讀取圖片資訊RGB
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);

	var div = win.document.querySelector("div");
	div.addEventListener('click', function(event){
		if (event.target.tagName.toLowerCase() === 'button') {
	    	//建立濾鏡
	    	filter.name = event.target.id;
	    	var output = draw.ctx.createImageData(draw.img.width,draw.img.height);
	    	if(filter.name == "laplace" || filter.name == "sobel" ){
	    		if(filter.name == "laplace"){
	    			filter.size = 3;
					for(var i=0;i<filter.size;i++){
						filter.matrix[i] = new Array(filter.size);
						for(var j=0;j<filter.size;j++){
							filter.matrix[i][j] = -1;
						}
					}
					filter.matrix[Math.floor(filter.size/2)][Math.floor(filter.size/2)] = (filter.size * filter.size - 1);
				}
				else if(filter.name == "sobel"){
					filter.size = 3;
					filter.matrix = new Array();
					filter.matrix[0] = [1,0,-1];
					filter.matrix[1] = [2,0,-2];
					filter.matrix[2] = [1,0,-1];
				}
				//convolution
				var half = Math.floor(filter.size / 2);
				for(var y=0;y<draw.img.height-1;y++){
					for(var x=0;x<draw.img.width-1;x++){
						var px = (y * draw.img.width + x) * 4;
						var r = 0, g = 0, b = 0;
						for (var cy = 0; cy < filter.size; cy++){
			       			for (var cx = 0; cx < filter.size; cx++){
			        			var cpx = ((y + (cy - half)) * draw.img.width + (x + (cx - half))) * 4;
			        			r += imgData.data[cpx] * filter.matrix[cy][cx];
			        			g += imgData.data[cpx + 1] * filter.matrix[cy][cx];
			        			b += imgData.data[cpx + 2] * filter.matrix[cy][cx];
			        		}
			        	}
			        	output.data[px] = Math.round(r);
			        	output.data[px + 1] = Math.round(g);
			        	output.data[px + 2] = Math.round(b);
			        	output.data[px + 3] = imgData.data[cpx + 3];
			        }
			    }
	    	}
	    	draw.ctx.putImageData((filter.name == "reset")? imgData : output,0,0);
	  	}
	}, true);
}

/*HW7 histEqual*/
function HistEqual(){

	var draw = Draw();

	//讀取圖片資訊RGB
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var hbuffer = new ArrayBuffer(256*2);
	var hist = new Uint16Array(hbuffer);
	for(var i=0;i<imgData.data.length/4;i++){
		var r = imgData.data[i*4+0];
		var g = imgData.data[i*4+1];
		var b = imgData.data[i*4+2];
		var h = Math.round((r+g+b)/3);
		imgData.data[i*4+0] = h;
		imgData.data[i*4+1] = h;
		imgData.data[i*4+2] = h;
		hist[h]++;
	}

	//複製原圖灰階
	var OimgData = draw.ctx.createImageData(imgData);
	for(var i=0;i<imgData.data.length;i++){
		OimgData.data[i] = imgData.data[i];
	}

	//建立 cumulative histrogram
	var cbuffer = new ArrayBuffer(256*4);
	var chist = new Uint32Array(cbuffer);
	chist[0] = hist[0];
	for(var i = 1;i < hist.length;i++){
		chist[i] = chist[i-1] + hist[i];
	}

	//求最小值
	var min = Math.max.apply(null, chist);
	var cmin = -1;
	for(var i=0;i<hist.length;i++){
		if(chist[i] > 0 && min > chist[i]){
			min = chist[i];
			cmin = i;
		}
	}

	//T
	var tbuffer = new ArrayBuffer(256*4);
	var thist = new Int32Array(tbuffer);
	for(var i=0;i<hist.length;i++){
		thist[i] = Math.round( (chist[i] - min) / ( chist[255] - 1 ) * 255 );
	}

	//重製
	for(var i=0;i<OimgData.data.length/4;i++){
		var tmp = thist[OimgData.data[i*4+0]];
		OimgData.data[i*4+0] = tmp;
		OimgData.data[i*4+1] = tmp;
		OimgData.data[i*4+2] = tmp;
		OimgData.data[i*4+3] = 255;
	}
	draw.ctx.putImageData(OimgData,0,0);
	
	//另開視窗
	var win = window.open("", "AIP40247008S-work8-new","fullscreen=yes");
	win.document.open("text/html");
	win.document.write("<style>body{margin:0;padding:0;background-color: #FCFCEC;} .block{width: 47.5%;height: 80vh;margin: 0vh 1% 0vh 1%;display:block;float:left;border-style:solid;border-width:2vh 2% 2vh 2%;border-color:#775500;} .fix{padding:0;overflow: hidden;height:inherit;}</style>");
	win.document.write("<div class='block'><div id='input' class='fix dragscroll'></div></div>");
	win.document.write("<div class='block'><div id='output' class='fix dragscroll'></div></div>");
	win.document.write("<div class='block'><div id='ihist' class='fix dragscroll'></div></div>");
	win.document.write("<div class='block'><div id='ohist' class='fix dragscroll'></div></div>");
	
	var input = new photo(win.document.getElementById("input"));
	input.create();
	win.document.getElementById("input").appendChild(input.canvas);
	input.resize(draw.canvas.width,draw.canvas.height);
	input.ctx.putImageData(imgData,0,0);
	
	var ihist = new photo(win.document.body);
	ihist.create();
	win.document.getElementById("ihist").appendChild(ihist.canvas);
	ihist.resize(512,450);
	ihist.clear();
	var h_width = ihist.canvas.width;
	var h_height = ihist.canvas.height;
	for(var i = 0; i < 256; i++){
		ihist.ctx.beginPath();
		ihist.ctx.lineWidth="2";
		ihist.ctx.strokeStyle="black";
		ihist.ctx.moveTo(i*ihist.ctx.lineWidth,h_height);
		ihist.ctx.lineTo(i*ihist.ctx.lineWidth,h_height - (hist[i]/ Math.max.apply(null, hist) * h_height));
		ihist.ctx.stroke();
	}

	var output = new photo(win.document.getElementById("output"));
	output.create();
	win.document.getElementById("output").appendChild(output.canvas);
	output.resize(draw.canvas.width,draw.canvas.height);
	output.ctx.putImageData(OimgData,0,0);
	
	//建立直方圖
	for(var i = 0;i<hist.length;i++){
		hist[i] = 0;
	}
	for(var i=0;i<OimgData.data.length/4;i++){
		var h = Math.round((OimgData.data[i*4+0]+OimgData.data[i*4+1]+OimgData.data[i*4+2]) / 3 );
		hist[h]++;
	}
	var ohist = new photo(win.document.getElementById("oHist"));
	ohist.create();
	win.document.getElementById("ohist").appendChild(ohist.canvas);
	ohist.resize(512,450);
	ohist.clear();
	var h_width = ohist.canvas.width;
	var h_height = ohist.canvas.height;
	for(var i = 0; i < 256; i++){
		ohist.ctx.beginPath();
		ohist.ctx.lineWidth="2";
		ohist.ctx.strokeStyle="black";
		ohist.ctx.moveTo(i*ohist.ctx.lineWidth,h_height);
		ohist.ctx.lineTo(i*ohist.ctx.lineWidth,h_height - (hist[i]/ Math.max.apply(null, hist) * h_height));
		ohist.ctx.stroke();
	}
	win.document.close();
}


/*HW6 colorPicker*/
function ColorPicker(){
	var draw = Draw();
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var imageArray = imgData.data;

	//定義顏色箱
	var colorName = ["white","red","orange","yellow","green","blue","purple","gray","black"];
	var colorBox = new Array();
	for(var i=0;i<colorName.length;i++)
		colorBox[colorName[i]] = 0;
	
	//RGB TO HSV
	var hsvBuffer = new ArrayBuffer(imgData.data.length * 4);
	var hsv = new Float32Array(hsvBuffer);
	var tag = [];
	for(var i=0;i<imgData.data.length/4;i++){
		var r = imgData.data[i*4]/255;
		var g = imgData.data[i*4+1]/255;
		var b = imgData.data[i*4+2]/255;
		var max = Math.max(r, g, b);
		var min = Math.min(r, g, b);
  		var h, s, v = max;
		var d = max - min;
		s = max == 0 ? 0 : d / max;
		if (max == min) {
			h = 0;
		} 
		else {
		    switch (max) {
		      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
		      case g: h = (b - r) / d + 2; break;
		      case b: h = (r - g) / d + 4; break;
		    }
		    h /= 6;
		}
		hsv[i*4] = h;
		hsv[i*4+1] = s;
		hsv[i*4+2] = v;
		hsv[i*4+3] = imgData.data[i*4+3]/255;
	
		//色彩辨識
		var color = "";
		if(s == 0){ 
			// 灰白黑
			switch (v){
				case 1: color = "white"; break;
				case 0: color = "black"; break;
				default: color = "gray"; break;
			}
		}
		else if( v==0 ){
			color = "black";//黑
		}
		else{
			var tmpH = h * 360;
			if( (0 <= tmpH && tmpH <=18) || (354 < tmpH && tmpH<=360))
				color = "red";
			else if( 18 < tmpH && tmpH <= 42)
				color = "orange";
			else if( 42 < tmpH && tmpH <= 66)
				color = "yellow";
			else if( 66 < tmpH && tmpH <= 162 )
				color = "green";
			else if(162 < tmpH && tmpH <= 264)
				color = "blue";
			else if( 264 < tmpH && tmpH <= 354 )
				color = "purple";
		}
		colorBox[color] ++;
		tag.push(color);
	}

	//最大數目統計
	var max = new Object();
	max.name="";
	max.vote=0;
	for(var i =0;i<colorName.length;i++){
		if(colorBox[colorName[i]] > max.vote ){
			max.name = colorName[i];
			max.vote = colorBox[colorName[i]];
		}
	}
	
	//黑白顯色
	for(var i=0;i<imgData.data.length/4;i++){
		if(tag[i] == max.name){
			imgData.data[i*4+0] = 255;
			imgData.data[i*4+1] = 255;
			imgData.data[i*4+2] = 255;
		}
		else{
			imgData.data[i*4+0] = 0;
			imgData.data[i*4+1] = 0;
			imgData.data[i*4+2] = 0;
		}
	}
	draw.ctx.putImageData(imgData,0,0);
}


/*HW5 FFT*/
function FourierImage(){
	
	var draw = Draw();
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var x =FFT2D(imgData,draw.img.width,draw.img.height,"FFT");
	console.log(x);
	/*//重建畫布
	var draw = Draw();
	var width = draw.img.width;
	var height = draw.img.height;
	var re = [];
	var im = [];

	//影像尺寸填充
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var imageArray = imgData.data;
	var Rwidth = Math.ceil(Math.log(width) / Math.log(2));
	var Rheight = Math.ceil(Math.log(height) / Math.log(2));
	Rwidth = 1 << Rwidth;
	Rheight = 1 << Rheight;
	for(var i=0;i<imgData.data.length/4;i++){
		var tmp = Math.round((imgData.data[i*4] + imgData.data[i*4+1] + imgData.data[i*4+2] ) / 3);
		imgData.data[i*4]	= tmp;
		imgData.data[i*4+1]	= tmp;
		imgData.data[i*4+2]	= tmp;
	}
	
	var Xcanvas = document.createElement("canvas");
	var Xctx = Xcanvas.getContext("2d");
	Xcanvas.width = Rwidth;
	Xcanvas.height = Rheight;
	Xctx.putImageData(imgData, 0, 0);

	var iRwidth,iRheight;
	if(Rwidth >= Rheight){
		iRwidth = (Rwidth > 128) ? 128 : Rwidth;
		iRheight = Rheight * iRwidth / Rwidth;
	}
	else{
		iRheight = (Rheight > 128) ? 128 : Rheight;
		iRwidth = Rwidth * iRheight / Rheight;
	}
	draw.clear();
	draw.resize(iRwidth,iRheight);
	draw.ctx.drawImage(Xcanvas,0,0,Rwidth,Rheight,0,0,iRwidth,iRheight);*/
}

/*HW4 ColorConvert*/
function ColorConvert(){
	alert("轉換的色彩空間為CMYK");
	
	//重建畫布
	var draw = Draw();

	//像素轉換
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var imageArray = imgData.data;
	var buffer = new ArrayBuffer(draw.canvas.width * draw.canvas.height * 4 * 4);
    var cmyk = new Float32Array(buffer);
	for(var i=0;i<imgData.data.length/4;i++){
		var rgb = new Array(imgData.data[i*4]/255,imgData.data[i*4+1]/255,imgData.data[i*4+2]/255);
		//RGB轉CMYK
		cmyk[i*4+3] = 1 - Math.max(rgb[0],rgb[1],rgb[2]) ;
		cmyk[i*4] = (1 - rgb[0] - cmyk[i*4+3]) / (1 - cmyk[i*4+3]);
		cmyk[i*4+1] = (1 - rgb[1] - cmyk[i*4+3]) / (1 - cmyk[i*4+3]);
		cmyk[i*4+2] = (1 - rgb[2] - cmyk[i*4+3]) / (1 - cmyk[i*4+3]);
	}

	//GCMYK
	var XimgData = new Array();
	for (var i = 0; i< 4 ;i ++)
		XimgData[i] = draw.ctx.createImageData(draw.canvas.width,draw.canvas.height);

	for(i=0; i<imgData.data.length/4; i++){
		//灰階處理
		var gray = 255 * ( (1 - cmyk[i*4+3]) * (1 - cmyk[i*4]) + (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+1]) +  (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+2])) / 3;
		XimgData[0].data[i*4] = gray;
		XimgData[0].data[i*4+1] = gray;
		XimgData[0].data[i*4+2] = gray;
		XimgData[0].data[i*4+3] = 255;
		
		//C版處理
		XimgData[1].data[i*4] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4]);
		XimgData[1].data[i*4+1] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4]);
		XimgData[1].data[i*4+2] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4]);
		XimgData[1].data[i*4+3] = 255;
		
		//M版處理
		XimgData[2].data[i*4] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+1]);
		XimgData[2].data[i*4+1] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+1]);
		XimgData[2].data[i*4+2] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+1]);
		XimgData[2].data[i*4+3] = 255;

		//Y版處理
		XimgData[3].data[i*4] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+2]);
		XimgData[3].data[i*4+1] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+2]);
		XimgData[3].data[i*4+2] = 255 * (1 - cmyk[i*4+3]) * (1 - cmyk[i*4+2]);
		XimgData[3].data[i*4+3] = 255;
	}
	
	var Xcanvas = document.createElement("div");
	for(var i = 0; i < 4; i++){
		var tcanvas = document.createElement("canvas");
		var tctx = tcanvas.getContext("2d");
		tcanvas.width = draw.canvas.width;
		tcanvas.height = draw.canvas.height;
		tctx.putImageData(XimgData[i],0,0);
		Xcanvas.appendChild(tcanvas);
	}
	draw.ctx.drawImage(Xcanvas.children[0],0,0,draw.canvas.width,draw.canvas.height,0,0,draw.canvas.width/2,draw.canvas.height/2);
	draw.ctx.drawImage(Xcanvas.children[1],0,0,draw.canvas.width,draw.canvas.height,draw.canvas.width/2,0,draw.canvas.width/2,draw.canvas.height/2);
	draw.ctx.drawImage(Xcanvas.children[2],0,0,draw.canvas.width,draw.canvas.height,0,draw.canvas.height/2,draw.canvas.width/2,draw.canvas.height/2);
	draw.ctx.drawImage(Xcanvas.children[3],0,0,draw.canvas.width,draw.canvas.height,draw.canvas.width/2,draw.canvas.height/2,draw.canvas.width/2,draw.canvas.height/2);
}


/*HW3 高斯雜訊*/
function Noise(){

	var deviation = 1;
	do{
		deviation = prompt("請輸入標準差", "1");
	}
	while(deviation < 0);

	//重建畫布
	var draw = Draw();

	//雜訊製造
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var buffer = new ArrayBuffer(draw.canvas.width * draw.canvas.height * 4);
    var pixels = new Float32Array(buffer);
	for(var i = 0; i < draw.canvas.width * draw.canvas.height; i++){
		var phi = Math.random();
		var r = 1;
		do{
			r = Math.random();
		}
		while(r == 0);
		var z1 = deviation * Math.cos(2 * Math.PI * phi) * Math.sqrt((-2) * Math.log(r));
		var z2 = deviation * Math.sin(2 * Math.PI * phi) * Math.sqrt((-2) * Math.log(r));
		pixels[i] = z1;
		pixels[i+1] = z2;
	}

	//雜訊添加
	var imageArray = imgData.data;
	for(var i=0;i<pixels.length * 4;i++){
		if(i % 4 == 3)
			continue;
		imageArray[i] = Math.round(imageArray[i] + pixels[Math.floor(i/4)]);
	}
	draw.ctx.putImageData(imgData, 0, 0);

	//處理高斯雜訊直方圖
	var buffer = new ArrayBuffer(256*2);
	var h = new Uint16Array(buffer);
	for(var i=0;i<pixels.length;i+=4){
		var tmph = Math.round(pixels[i]+128);
		h[tmph]++;
	}

	//另開視窗
	var win = window.open("", "AIP40247008S-work3","width=600,height=800");
	win.document.open("text/html");
	win.document.write("<p></p>");

	//繪製直方圖
	var hist = new photo(win.document.body);
	hist.create();
	win.document.body.removeChild(win.document.body.lastChild);
	win.document.body.appendChild(hist.canvas);
	hist.resize(512,600);
	hist.clear();
	var h_width = hist.canvas.width;
	var h_height = hist.canvas.height;
	for(var i = 0; i < 256; i++){
		hist.ctx.beginPath();
		hist.ctx.lineWidth="2";
		hist.ctx.strokeStyle="black";
		hist.ctx.moveTo(i*hist.ctx.lineWidth,h_height);
		hist.ctx.lineTo(i*hist.ctx.lineWidth,h_height - (h[i]/ Math.max.apply(null, h) * h_height));
		hist.ctx.stroke();

	}
	win.document.close();
}


/*HW2 繪製直方圖*/
function Histogram(){

	//重建畫布
	var draw = Draw();

	//讀取圖片資訊RGB
	var imgData = draw.ctx.getImageData(0,0,draw.img.width,draw.img.height);
	var buffer = new ArrayBuffer(256*2);
	var histogram = new Uint16Array(buffer);
	for(var i=0;i<imgData.data.length;i+=4){
		var r = imgData.data[i*4+0];
		var g = imgData.data[i*4+1];
		var b = imgData.data[i*4+2];
		var h = Math.round((r+g+b)/3);
		histogram[h]++;
	}

	//畫布清除
	draw.resize(640,360);
	draw.clear();
	
	//設定長寬
	var c_width = 256*2;
	var c_height = draw.canvas.height * 0.8;
	var x_start = draw.canvas.width * 0.1;
	var y_start = draw.canvas.height * 0.9;
	
	//繪製直方圖
	for(var i=0;i<256;i++){
		draw.ctx.beginPath();
		draw.ctx.lineWidth="2";
		draw.ctx.strokeStyle="black";
		draw.ctx.moveTo(x_start + i*draw.ctx.lineWidth,y_start);
		draw.ctx.lineTo(x_start + i*draw.ctx.lineWidth,y_start - (histogram[i] / Math.max.apply(null, histogram) * c_height));
		draw.ctx.stroke();
	}
}

/*HW1*/
function Draw(){

	var draw = new photo(left);
	try{
		draw.create();
		if(left.lastChild.nodeName != "CANVAS" && left.lastChild.nodeName != "IMG"){	
			throw new Error("請先載入圖片");
		}
		draw.loadPhoto(left.lastChild);
		right.removeChild(right.lastChild);
		right.appendChild(draw.canvas);
		return draw;
	}
	catch(e){
		alert("請先載入圖片！");
	}
}

/*photo物件定義*/
var photo = function(canvas){
	this.canvas = canvas;
}

photo.prototype = {

	canvas:null,
	ctx:null,
	img:null,

	create:function(){
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.canvas.classList.add("obj");
		this.canvas.setAttribute("draggable","true");
		this.canvas.src = this.canvas.toDataURL();
	},

	loadPhoto:function(img){
		this.img = img;
		this.canvas.width = this.img.width; 
    	this.canvas.height = this.img.height; 
		this.ctx.drawImage(this.img,0,0,this.img.width,this.img.height);
	},

	resize:function(width,height){
		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.classList.add("obj");
	},

	clear:function(){
		this.ctx.fillStyle="white";
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
	}
};