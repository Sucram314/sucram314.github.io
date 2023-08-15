const header = document.getElementById("header");
const button = document.getElementById("button");
let lastScroll = 0;
let height = header.offsetHeight;

let didScroll = false;

window.onscroll = function (e){ 
    didScroll = true;
};

setInterval(function() {
    if (didScroll) {
        hasScrolled();
        didScroll = false;
    }
}, 250);

function hasScrolled() {
    let st = scrollTop = window.scrollY;

    if(st > lastScroll && st > height*1.5){
        header.classList.remove("down");
        header.classList.add("up");
    } else {
        header.classList.remove("up");
        header.classList.add("down");
    }

    lastScroll = st;
}

let dropped = false;

button.onclick = function(){
    if(dropped){
        header.classList.remove("dropped");
        header.classList.add("notdropped");
    } else {
        header.classList.remove("notdropped");
        header.classList.add("dropped");
    }
    dropped = !dropped;
}