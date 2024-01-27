const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d"),
W = canvas.width,
H = canvas.height;
const WH = W/2,
HH = H/2;

var origin = [WH,HH];

var grid = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

const gridNum = 4, cellSize = 200, cellPadding = 20;
const gridSize = (cellSize + cellPadding) * gridNum + cellPadding;

origin[0] -= gridSize/2; 
origin[1] -= gridSize/2;

function rgb(r,g,b){
    return `rgb(${r},${g},${b})`
}

function fill_rect(col,x,y,w,h,abs=false){
    ctx.fillStyle = col;
    if(abs) ctx.fillRect(x+WH, y+HH , w, h);
    else ctx.fillRect(x+origin[0], y+origin[1], w, h);
}

function fill_text(text,col,x,y,font="100px Roboto",align="center",base="middle",abs=false){
    ctx.fillStyle = col;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = base;

    if(abs) ctx.fillText(text, x+WH, y+HH);
    else ctx.fillText(text, x+origin[0], y+origin[1]);
}

function draw_grid(){
    fill_rect(rgb(69,69,69),-gridSize/2,-gridSize/2,gridSize,gridSize,true);

    ctx.fillStyle = rgb(100,100,100);

    for(let i=0; i<gridNum*gridNum; ++i){
        let x = (i%4)*(cellSize+cellPadding) + cellPadding,
        y = Math.floor(i/4)*(cellSize+cellPadding) + cellPadding;

        if(grid[i] == 0){
            fill_rect(rgb(100,100,100), x, y, cellSize, cellSize);
        } else {
            
            fill_rect(rgb(140,140,140),x, y, cellSize, cellSize);
            fill_text(grid[i], rgb(255,255,255), x+cellSize/2, y+cellSize/2);
        }
    }
}

draw_grid();