const MAXSUGGESTIONS = 10;
var dict, formdata;

var searching = false;
var current_word = "";

fetch('./resources/data/dictionary.json')
    .then(res => res.json())
    .then(data => {dict = data;});

fetch('./resources/data/forms.json')
    .then(res => res.json())
    .then(data => {formdata = data;});

const dictionary = document.querySelector(".dictionary-container"),
searchBar = dictionary.querySelector("input"),
infoText = dictionary.querySelector(".info-text"),
container = dictionary.querySelector(".dictionary-container ul"),
Warning = dictionary.querySelector(".warning"),
Word = dictionary.querySelector(".word"),
Meaning = dictionary.querySelector(".meaning"),
Forms = dictionary.querySelector(".forms"),
Xbutton = dictionary.querySelector(".search span");

function createInteractiveDropdown(parent,title){
    var section = document.createElement("div");
    section.classList.add("interactive-dropdown-container");
    section.innerHTML = `<aside><span>${title}</span><i class="fa fa-caret-right"></i></aside>`;

    section.querySelector("aside").addEventListener("click", function(){
        if(this.parentNode.classList.contains("open")) this.parentNode.classList.remove("open");
        else this.parentNode.classList.add("open");
    })

    var dropdown = document.createElement("div");
    dropdown.classList.add("interactive-dropdown");

    var inner = document.createElement("div");
    dropdown.appendChild(inner);
    section.appendChild(dropdown)
    parent.appendChild(section);
    return inner;
}

function search(word){
    if(current_word === word){
        searching = false;
        return;
    }

    dictionary.classList.remove("active");
    
    infoText.innerHTML = `Fetching data for "<span>${word}</span>" ...`

    result = dict[word];

    if(result === undefined){
        current_word = "";
        searching = false;
        infoText.innerHTML = `Could not find the word "<span>${word}</span>" - consider checking the spelling?<br>(or requesting a word to be added)`
        return;
    }

    setTimeout(() => {
        searching = false;

        current_word = word;
        infoText.innerHTML = `Results for "<span>${word}</span>"`
        Warning.classList.remove("active");
        dictionary.classList.add("active");
    
        Word.querySelector("p").innerText = word + (result["root"] ? ", " + result["root"] + "-" : "");
        Word.querySelector("span").innerText = result["type"] + (result["declension"] ? " / " + result["declension"] : "") + (result["gender"] ? " / " + result["gender"] : "")
        Meaning.querySelector(".details span").innerText = result["meaning"];

        if(result["flag"]){
            Warning.classList.add("active");
            Warning.querySelector("span").innerHTML = `The following entry has been flagged for further review. <br><br> Reason: ${result["flag"]} <br><br> Please take this entry <i>cum granō salis</i>.`;
            Forms.classList.remove("active");
            return;
        }

        Forms.classList.add("active");
        var table = Forms.querySelector("table");
        table.replaceChildren();

        if(result["type"] === "noun"){
            var dat = formdata["noun"], root;

            table.insertAdjacentHTML("beforeend",`<tr><th></th><th>Singular</th><th>Plural</th></tr>`);

            if(result["declension"] === "I"){
                root = word.substring(0,word.length-1);
                dat = dat["I"];
            } else if(result["declension"] === "II"){
                root = word.substring(0,word.length-2+(word.charAt(word.length-1) === "r"));
                dat = dat["II"][word.charAt(word.length-1) === "r" ? "r" : "u"+word.charAt(word.length-1)];
            } else if(result["declension"] === "III"){
                root = result["root"];
                dat = dat["III"][result["gender"] == "n" ? "n" : "!n"];
            } else if(result["declension"] === "IV"){
                root = word.substring(0,word.length-2);
                dat = dat["IV"];
            }

            table.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${word}</td><td>${root + dat["plural"]["nominative"]}</td></tr>`);
            table.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${dat["singular"]["accusative"] ? root + dat["singular"]["accusative"] : word}</td><td>${root + dat["plural"]["accusative"]}</td></tr>`);
            table.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${root + dat["singular"]["genitive"]}</td><td>${root + dat["plural"]["genitive"]}</td></tr>`);
            table.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + dat["singular"]["ablative"]}</td><td>${root + dat["plural"]["ablative"]}</td></tr>`);
            table.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${root + dat["singular"]["dative"]}</td><td>${root + dat["plural"]["dative"]}</td></tr>`);
        } else if(result["type"] === "verb"){
            var dat = formdata["verb"][result["declension"]], subdat, linked, 
            root = word.substring(0,word.length-1-(result["declension"] === "II" || result["declension"] === "III spec" || result["declension"] === "IV"));

            // table.insertAdjacentHTML("beforeend",`<span>does not work (yet)</span><br>`);

            var container, content;
            
            container = createInteractiveDropdown(table,"Active");
            content = document.createElement("table");

            subdat = dat["active"]["present"];
            content.insertAdjacentHTML("beforeend",`<tr><th>Present</th><th>Singular</th><th>Plural</th></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

            content.insertAdjacentHTML("beforeend",`<tr><th></th></tr>`);

            subdat = formdata["verb"]["imperfect"]["active"]["past"];
            linked = root + dat["past-imperfect-link"];
            content.insertAdjacentHTML("beforeend",`<tr><th>Past Imperfect</th><th>Singular</th><th>Plural</th></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

            content.insertAdjacentHTML("beforeend",`<tr><th></th></tr>`);

            subdat = formdata["verb"]["imperfect"]["active"]["future"][result["declension"] === "I" || result["declension"] === "II" ? "I~II" : "!I~II"];
            linked = root + dat["future-imperfect-link"];
            content.insertAdjacentHTML("beforeend",`<tr><th>Future Imperfect</th><th>Singular</th><th>Plural</th></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

            container.appendChild(content);

            container = createInteractiveDropdown(table,"Passive");
            content = document.createElement("table");

            subdat = dat["passive"]["present"];
            content.insertAdjacentHTML("beforeend",`<tr><th>Present</th><th>Singular</th><th>Plural</th></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

            content.insertAdjacentHTML("beforeend",`<tr><th></th></tr>`);

            subdat = formdata["verb"]["imperfect"]["passive"]["past"];
            linked = root + dat["past-imperfect-link"];
            content.insertAdjacentHTML("beforeend",`<tr><th>Past Imperfect</th><th>Singular</th><th>Plural</th></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

            content.insertAdjacentHTML("beforeend",`<tr><th></th></tr>`);

            subdat = formdata["verb"]["imperfect"]["passive"]["future"][result["declension"] === "I" || result["declension"] === "II" ? "I~II" : "!I~II"];
            linked = root + dat["future-imperfect-link"];
            content.insertAdjacentHTML("beforeend",`<tr><th>Future Imperfect</th><th>Singular</th><th>Plural</th></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
            content.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);


            container.appendChild(content);

        } else if(result["type"] === "adjective"){
            var dat = formdata["adjective"], subdat, root;

            if(result["declension"] === "I~II"){
                root = word.substring(0,word.length-2) + (word.charAt(word.length-1) === "r" ? "r" : "");
                dat = dat["I~II"]["positive"];

                subdat = dat["singular"];
                table.insertAdjacentHTML("beforeend",`<tr><th><b>Singular</b></th><th>Feminine</th><th>Masculine</th><th>Neuter</th></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${root + subdat["f"]["nominative"]}</td><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["f"]["accusative"]}</td><td>${root + subdat["m"]["accusative"]}</td><td>${root + subdat["n"]["accusative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${root + subdat["f"]["genitive"]}</td><td>${root + subdat["m"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["f"]["ablative"]}</td><td>${root + subdat["m"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${root + subdat["f"]["dative"]}</td><td>${root + subdat["m"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);

                table.insertAdjacentHTML("beforeend",`<tr><th></th></tr>`);

                subdat = dat["plural"];
                table.insertAdjacentHTML("beforeend",`<tr><th><b>Plural</b></th><th>Feminine</th><th>Masculine</th><th>Neuter</th></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${root + subdat["f"]["nominative"]}</td><td>${root + subdat["m"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["f"]["accusative"]}</td><td>${root + subdat["m"]["accusative"]}</td><td>${root + subdat["n"]["accusative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${root + subdat["f"]["genitive"]}</td><td>${root + subdat["m"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["f"]["ablative"]}</td><td>${root + subdat["m"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${root + subdat["f"]["dative"]}</td><td>${root + subdat["m"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);
            } else if(result["declension"] === "III"){
                root = word.substring(0,word.length-2);
                dat = dat["III"]["positive"];

                subdat = dat["singular"];
                table.insertAdjacentHTML("beforeend",`</th><th><b>Singular</b></th><th colspan="2">Feminine/Masculine</th><th>Neuter</th></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td colspan="2">${root + subdat["!n"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td colspan="2">${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["accusative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td colspan="2">${root + subdat["!n"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td colspan="2">${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td colspan="2">${root + subdat["!n"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);

                table.insertAdjacentHTML("beforeend",`<tr><th></th></tr>`);

                subdat = dat["plural"];
                table.insertAdjacentHTML("beforeend",`</th><th><b>Plural</b></th><th colspan="2">Feminine/Masculine</th><th>Neuter</th></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td colspan="2">${root + subdat["!n"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td colspan="2">${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["accusative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td colspan="2">${root + subdat["!n"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td colspan="2">${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                table.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td colspan="2">${root + subdat["!n"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);
            }
        } else Forms.classList.remove("active");

    }, 420 + Math.random() * 69);
}

function closeAllLists() {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++)
        x[i].parentNode.removeChild(x[i]);
}

function normalize(word){
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

searchBar.addEventListener("keydown", function(e) {
    if(e.key == "Enter" && e.target.value && !searching){
        var x = document.getElementById(this.id + "autocomplete-list");
        if(x && x.children.length) searchBar.value = x.children[0].getElementsByTagName("input")[0].value;
        closeAllLists();
        searching = true;
        search(e.target.value);
    }
})

searchBar.addEventListener("input",function(e){
    var a, b, val = normalize(this.value);

    closeAllLists();
    if(!val) return;

    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");

    this.parentNode.appendChild(a);

    var suggestions = 0;

    for(var word in dict) {
        if (normalize(word).substring(0, val.length).toUpperCase() == val.toUpperCase()) {
            b = document.createElement("DIV");

            b.innerHTML = "<b>" + word.substring(0, val.length) + "</b>" + word.substring(val.length);
            b.innerHTML += "<input type='hidden' value='" + word + "'>";

            b.addEventListener("click", function(e) {
                searchBar.value = this.getElementsByTagName("input")[0].value;
                if(!searching){
                    searching = true;
                    search(searchBar.value);
                }
                closeAllLists();
            });
            a.appendChild(b);
            if(++suggestions == MAXSUGGESTIONS) break;
        }
    }
})

document.addEventListener("click", function(e){
    closeAllLists(e.target);
});

Xbutton.addEventListener("mousedown",function(e){
    searchBar.value = "";
})