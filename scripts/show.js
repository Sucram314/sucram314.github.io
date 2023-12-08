window.addEventListener("DOMContentLoaded", function() {
    if(localStorage.getItem("dark") === "true")
        document.querySelector("html").classList.add("dark");
});

window.onload = function(){
    document.getElementById("hideAll").style.display="none";
}