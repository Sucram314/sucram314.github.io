const header = document.getElementById("header");
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
    let st = scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

    if(st > lastScroll && st > height*1.5){
        header.classList.remove("down");
        header.classList.add("up");
    } else {
        header.classList.remove("up");
        header.classList.add("down");
    }

    lastScroll = st;
}