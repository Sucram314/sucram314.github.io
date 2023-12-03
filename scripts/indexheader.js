const html = document.querySelector("html"),
header = document.getElementById("header"),
button = document.getElementById("button"),
themeSelector = header.querySelector(".theme-selector");

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

    if(st <= height*1.5){
        header.classList.remove("down");
        header.classList.add("up");
    } else {
        header.classList.remove("up");
        header.classList.add("down");
    }

    lastScroll = st;
}

let dropped = false;

button.addEventListener("click", function(){
    if(dropped){
        header.classList.remove("dropped");
        header.classList.add("notdropped");
    } else {
        header.classList.remove("notdropped");
        header.classList.add("dropped");
    }
    dropped = !dropped;
});

themeSelector.addEventListener("click", function(){
    if(html.classList.contains("dark")){
        html.classList.remove("dark");
        localStorage.setItem("dark", false);
    } else {
        html.classList.add("dark");
        localStorage.setItem("dark", true);
    }
})