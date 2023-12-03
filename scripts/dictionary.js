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

function createSubTable(parent){
    var section = document.createElement("table");
    section.classList.add("subtable");
    
    parent.appendChild(section);
    return section;
}

function form(table, word, result, exceptions=[]){
    if(result["declension"] === "indeclinable") return false;

    if(result["type"] === "noun"){
        var dat = formdata["noun"], root, subtable;

        subtable = createSubTable(table);

        subtable.insertAdjacentHTML("beforeend",`<tr><th></th><th>Singular</th><th>Plural</th></tr>`);

        if(result["declension"] === "I"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1);
            dat = dat["I"];
        } else if(result["declension"] === "II"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2+(word.charAt(word.length-1) === "r"));
            dat = dat["II"][word.charAt(word.length-1) === "r" ? "r" : "u"+word.charAt(word.length-1)];
        } else if(result["declension"] === "III"){
            root = exceptions["root"] ? exceptions["root"] : result["root"];
            dat = dat["III"][result["gender"] == "n" ? "n" : "!n"];
        } else if(result["declension"] === "IV"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2);
            dat = dat["IV"];
        }

        subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${word}</td><td>${root + dat["plural"]["nominative"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${dat["singular"]["accusative"] ? root + dat["singular"]["accusative"] : word}</td><td>${root + dat["plural"]["accusative"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${root + dat["singular"]["genitive"]}</td><td>${root + (exceptions["i-stem"] ? "<b>i</b>" : "") + dat["plural"]["genitive"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + (exceptions.includes["abl-i-stem"] ? "<b>ī</b>" : dat["singular"]["ablative"])}</td><td>${root + dat["plural"]["ablative"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${root + dat["singular"]["dative"]}</td><td>${root + dat["plural"]["dative"]}</td></tr>`);

    } else if(result["type"] === "verb"){
        var dat = formdata["verb"][result["declension"]], subdat, linked, newRoot, subtable,
        root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1-(result["declension"] === "II" || result["declension"] === "III spec" || result["declension"] === "IV"));

        var container, content;
        
        container = createInteractiveDropdown(table,"Active");
        content = document.createElement("table");

        subtable = createSubTable(content);
        subdat = dat["active"]["present"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Present</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content);
        subdat = formdata["verb"]["aorist"]["active"];
        newRoot = result["aorist-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Aorist</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content);
        subdat = formdata["verb"]["imperfect"]["active"]["past"];
        linked = root + dat["past-imperfect-link"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Past Imperfect</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content);
        subdat = formdata["verb"]["imperfect"]["active"]["future"][result["declension"] === "I" || result["declension"] === "II" ? "I~II" : "!I~II"];
        linked = root + dat["future-imperfect-link"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Future Imperfect</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Passive");
        content = document.createElement("table");

        subtable = createSubTable(content);
        subdat = dat["passive"]["present"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Present</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content);
        subdat = formdata["verb"]["aorist"]["passive"];
        newRoot = result["aorist-passive-participle"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Aorist</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content);
        subdat = formdata["verb"]["imperfect"]["passive"]["past"];
        linked = root + dat["past-imperfect-link"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Past Imperfect</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content);
        subdat = formdata["verb"]["imperfect"]["passive"]["future"][result["declension"] === "I" || result["declension"] === "II" ? "I~II" : "!I~II"];
        linked = root + dat["future-imperfect-link"];
        subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Future Imperfect</b></th><th>Singular</th><th>Plural</th></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>1st</th><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>2nd</th><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><th>3rd</th><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Participle");
        content = document.createElement("table");

        subtable = createSubTable(content);
        form(subtable, root + dat["present-partciple-link"] + "ns", {"type":"adjective","declension":"III"});

        subtable = createSubTable(content);
        form(subtable, result["aorist-passive-participle"] + "us", {"type":"adjective","declension":"I~II"});

        container.appendChild(content);

    } else if(result["type"] === "adjective"){
        var dat = formdata["adjective"], subdat, root, subtable;

        if(result["declension"] === "I~II"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2) + (word.charAt(word.length-1) === "r" ? "r" : "");
            dat = dat["I~II"]["positive"];

            subtable = createSubTable(table);
            subdat = dat["singular"];
            subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Singular</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${root + subdat["f"]["nominative"]}</td><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["f"]["accusative"]}</td><td>${root + subdat["m"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["f"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["m"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["f"]["ablative"]}</td><td>${root + subdat["m"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["f"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["m"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);

        
            subtable = createSubTable(table);
            subdat = dat["plural"];
            subtable.insertAdjacentHTML("beforeend",`<tr><th><b>Plural</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${root + subdat["f"]["nominative"]}</td><td>${root + subdat["m"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["f"]["accusative"]}</td><td>${root + subdat["m"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${root + subdat["f"]["genitive"]}</td><td>${root + subdat["m"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["f"]["ablative"]}</td><td>${root + subdat["m"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${root + subdat["f"]["dative"]}</td><td>${root + subdat["m"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);
        } else if(result["declension"] === "III"){
            dat = dat["III"]["positive"];
            subdat = dat["singular"];
            subtable = createSubTable(table);

            if(word.charAt(word.length-1) === "r"){
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2) + "r";
                
                subtable.insertAdjacentHTML("beforeend",`</th><th><b>Singular</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${root + subdat["!n"]["nominative"]}</td><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);

            } else if(word.charAt(word.length-2) === "n" && word.charAt(word.length-1) === "s"){
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-3) + normalize(word.charAt(word.length-3)) + "nt";

                subtable.insertAdjacentHTML("beforeend",`</th><th><b>Singular</b></th><th>f./m.</th><th>n.</th></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${word}</td><td>${word}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["!n"]["accusative"]}</td><td>${word}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);
            } else {
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2)

                subtable.insertAdjacentHTML("beforeend",`</th><th><b>Singular</b></th><th>f./m.</th><th>n.</th></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);
            }

            subtable = createSubTable(table);
            subdat = dat["plural"];
            subtable.insertAdjacentHTML("beforeend",`</th><th><b>Plural</b></th><th>f./m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nominative</th><td>${root + subdat["!n"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Accusative</th><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Genitive</th><td>${root + subdat["!n"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Ablative</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dative</th><td>${root + subdat["!n"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);
        }
    } else return false;
    return true;
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
    
        Word.querySelector("p").innerText = word + (result["root"] ? ", " + result["root"] + "is" : "") + (result["type"] === "verb" ? ", " + result["infinitive"] : "");
        Word.querySelector("span").innerText = result["type"] + (result["declension"] ? " / " + result["declension"] : "") + (result["gender"] ? " / " + result["gender"] + "." : "")
        Meaning.querySelector(".details span").innerText = result["meaning"];

        if(result["flag"]){
            Warning.classList.add("active");
            Warning.querySelector("span").innerHTML = `The following entry has been flagged for further review. <br><br> Reason: ${result["flag"]} <br><br> Please take this entry <i>cum granō salis</i>.`;
            Forms.classList.remove("active");
            return;
        }

        var exceptions = result["exceptions"] ? result["exceptions"] : [];

        Forms.classList.add("active");
        var table = Forms.querySelector("table");
        table.replaceChildren();

        if(!form(table,word,result,exceptions)) Forms.classList.remove("active");

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
    if(e.key === "Enter" && e.target.value && !searching){
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
        if (normalize(word).substring(0, val.length).toUpperCase() === val.toUpperCase()) {
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
            if(++suggestions === MAXSUGGESTIONS) break;
        }
    }
})

document.addEventListener("click", function(e){
    closeAllLists(e.target);
});

Xbutton.addEventListener("mousedown",function(e){
    searchBar.value = "";
})