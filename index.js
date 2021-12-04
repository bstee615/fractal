class Canvas {
    constructor() {
    }

    origin() {
        return new Point(canvas.width / 2, canvas.height / 2);
    }
}

var canvas = document.getElementById("myCanvas");
canvas.width  = window.innerWidth - canvas.offsetLeft;
canvas.height = window.innerHeight - canvas.offsetTop;
var originX = canvas.width / 2;
var originY = canvas.height / 2;
window.addEventListener('resize', function() {
    canvas.width  = window.innerWidth - canvas.offsetLeft;
    canvas.height = window.innerHeight - canvas.offsetTop;
    originX = canvas.width / 2;
    originY = canvas.height / 2;
});
var ctx = canvas.getContext('2d');

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

class ScreenPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toPoint() {
        return new Point((this.x - originX) / UNIT, (this.y - originY) / UNIT);
    }

    lineToPoint() {
        ctx.lineTo(this.x, this.y);
    }

    moveTo() {
        ctx.moveTo(this.x, this.y);
    }

    isInBounds() {
        return (this.x >= 0 && this.x < canvas.width && this.y >= 0 && this.y < canvas.height);
    }
    
    fillCircleAtPoint(radius, color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        var oldFillStyle = ctx.fillStyle;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = oldFillStyle;
    }
    
    strokeCircleAtPoint(radius, color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        var oldStrokeStyle = ctx.strokeStyle;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.strokeStyle = oldStrokeStyle;
    }
}

class Point
{
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toScreen() {
        return new ScreenPoint((this.x * UNIT) + originX, (this.y * UNIT) + originY);
    }

    copy() {
        return new Point(this.x, this.y);
    }

    plus(p) {
        return new Point(this.x + p.x, this.y + p.y);
    }

    minus(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }

    timesComplex(p) {
        // (x + yi) (u + vi) = (xu - yv) + (xv + yu)i
        return new Point((this.x * p.x - this.y * p.y), (this.x * p.y + this.y * p.x));
    }
}

var contentBlock = document.getElementById("contentBlock");
var switchBtn = document.getElementById("switchBtn");
var instructionsBlock = document.getElementById("instructionsBlock");

var UNIT = 200;
var stride = 25;
var size = 10;
var interactiveMode = true;
var drew = false;

var numLinks = 5;
const MAX_NUM_LINKS = 50;
var mouseLocation = null;

function getText() {
    if (interactiveMode)
    {
        return `Interactive: true, ${numLinks} iterations`;
    }
    else
    {
        return `Interactive: false`;
    }
}

var origin = new Point(0, 0);
var trueOrigin = new Point(0, 0);
switchBtn.textContent = `Switch to ${interactiveMode ? "hi-res render" : "interactive"}`;
instructionsBlock.textContent = interactiveMode ? "Scroll up/down to add/remove iterations, use arrows to move origin" : "Click the button to switch back to interactive mode";
contentBlock.textContent = getText();

function doesItDiverge(point, origin, depth) {
    var nextPoint = point;
    for (var i = 0; i < depth; i++) {
        nextPoint = nextPoint.timesComplex(nextPoint).plus(origin);
        if (isNaN(nextPoint.x) || isNaN(nextPoint.y)) {
            return true;
        }
    }
    return false;
}

function drawMandelbrot(depth, stride, size) {
    for (var i = 0; i < canvas.width; i += stride) {
        for (var j = 0; j < canvas.height; j += stride) {
            var p = new ScreenPoint(i, j);
            if (doesItDiverge(origin, p.toPoint(), depth)) {
                p.fillCircleAtPoint(size, 'red');
            }
            else {
                p.fillCircleAtPoint(size, 'green');
            }
        }
    }
}

function drawMandelbrotTimed(depth, stride, size) {
    drew = true;
    for (var i = 0; i < canvas.width; i += stride) {
        for (var j = 0; j < canvas.height; j += stride) {
            var p = new ScreenPoint(i, j);
            if (!doesItDiverge(origin, p.toPoint(), depth)) {
                p.fillCircleAtPoint(size, 'green');
            }
        }
    }
}

function draw() {
    if (!interactiveMode) {
        if (!drew) {
            clearCanvas();
            drawMandelbrotTimed(250, 1, 1);
        }
    }
    else {
        clearCanvas();

        if (mouseLocation == null) {
            return;
        }

        // drawMandelbrot(numLinks, stride, size);

        var points = [mouseLocation];
        for (var i = 0; i < numLinks; i++) {
            mouseLocationPower = points[points.length-1].timesComplex(points[points.length-1]).plus(origin);
            if (isNaN(mouseLocationPower.x) || isNaN(mouseLocationPower.y)) {
                break;
            }
            points.push(mouseLocationPower);
        }
        points.push(origin);
        points = points.map(p => p.toScreen());
        
        var originScreen = origin.toScreen();
        var mouseLocationScreen = mouseLocation.toScreen();
        for (var i = 0; i < points.length-1; i ++) {
            ctx.beginPath();
            var p = points[i];
            var q = points[i+1];
            if (p.isInBounds() || q.isInBounds()) {
                ctx.moveTo(p.x, p.y);
                q.lineToPoint();
                ctx.stroke();
            }
        }

        var diverges = doesItDiverge(mouseLocation, origin, 50);
        var color = null;
        if (diverges) {
            var color = 'red';
        }
        else {
            var color = 'green';
        }

        originScreen.fillCircleAtPoint(5, color);
        originScreen.strokeCircleAtPoint(5, 'gray');
        for (var i = points.length-1; i >= 0; i --) {
            points[i].fillCircleAtPoint(5, color);
            points[i].strokeCircleAtPoint(5, 'gray');
        }

        ctx.font = '48px serif';
        ctx.fillText('z', mouseLocationScreen.x, mouseLocationScreen.y);
        ctx.fillText('c', originScreen.x, originScreen.y);

        ctx.beginPath();
        trueOrigin.minus(new Point(-1.5, 0)).toScreen().moveTo();
        trueOrigin.minus(new Point(1.5, 0)).toScreen().lineToPoint();
        ctx.stroke();
        ctx.beginPath();
        trueOrigin.minus(new Point(0, -1.5)).toScreen().moveTo();
        trueOrigin.minus(new Point(0, 1.5)).toScreen().lineToPoint();
        ctx.stroke();
        
        ctx.beginPath();
        trueOrigin.toScreen().strokeCircleAtPoint(UNIT, 'gray');
        ctx.stroke();
    }
}

window.addEventListener('mousemove', e => {
    var canvasRect = canvas.getBoundingClientRect();
    var offX = e.pageX + canvasRect.left;
    var offY = e.pageY + canvasRect.top;
    mouseLocation = new ScreenPoint(offX, offY).toPoint();
});

setInterval(draw, 1000/60);

canvas.addEventListener("wheel", function (e) {
    var variation = parseInt(e.deltaY);
    if (variation < 0) {
        if (numLinks < MAX_NUM_LINKS) {
            numLinks ++;
        }
    }
    else {
        if (numLinks > 0) {
            numLinks --;
        }
    }
    contentBlock.textContent = getText();
});

function switchInteractive() {
    interactiveMode = !interactiveMode;
    drew = false;
    switchBtn.textContent = `Switch to ${interactiveMode ? "hi-res render" : "interactive"}`;
    instructionsBlock.textContent = interactiveMode ? "Scroll up/down to add/remove iterations, use arrows to move origin" : "Click the button to switch back to interactive mode";
    contentBlock.textContent = getText();
}
// window.addEventListener('click', function(ev) {
    // var rect = switchBtn.getBoundingClientRect();
    // if (ev.offsetX > rect.left && ev.offsetX < rect.right)
    // {
    //     if (ev.offsetY > rect.top && ev.offsetY < rect.bottom)
    //     {
    //         switchInteractive();
    //     }
    // }
// });

var left = false;
var right = false;
var up = false;
var down = false;
function updatePosition() {
    if (left) {
        origin.x -= 0.01;
    }
    if (right) {
        origin.x += 0.01;
    }
    if (up) {
        origin.y -= 0.01;
    }
    if (down) {
        origin.y += 0.01;
    }
}
window.addEventListener('keyup', function(e) {
    if (e.key == 'ArrowRight') {
        right = false;
    }
    else if (e.key == 'ArrowLeft') {
        left = false;
    }
    else if (e.key == 'ArrowUp') {
        up = false;
    }
    else if (e.key == 'ArrowDown') {
        down = false;
    }
})
window.addEventListener('keydown', function(e) {
    if (e.key == 'ArrowRight') {
        right = true;
    }
    else if (e.key == 'ArrowLeft') {
        left = true;
    }
    else if (e.key == 'ArrowUp') {
        up = true;
    }
    else if (e.key == 'ArrowDown') {
        down = true;
    }
})
setInterval(updatePosition, 1000/60);
