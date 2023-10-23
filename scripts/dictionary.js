async function load_dictionary() {
    const res = await fetch('./resources/data/dictionary.json');
    return await res.json();
}
  
let data = load_dictionary();
let data2;

(async () => {
    console.log(await data);
    console.log((await data)["urmom"]);
  })()

const dictionary = document.querySelector(".dictionary-container"),
searchBar = dictionary.querySelector("input"),
infoText = dictionary.querySelector(".info-text");

function search(word){
    infoText.innerHTML = `Fetching data for "<span>${word}</span>" ...`
}

searchBar.addEventListener("keydown", e =>{
    if(e.key == "Enter" && e.target.value){
        search(e.target.value);
    }
})