window.onload = function(){
    if(localStorage.getItem("dark") === "true")
        document.querySelector("html").classList.add("dark");

    document.getElementById("hideAll").style.display="none";
}