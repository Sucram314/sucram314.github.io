const MAXSUGGESTIONS = 10;
var dict, formdata, redirects;

var searching = false,
current_word = "",
current_key = "",
redirected = false;

fetch('../resources/data/dictionary/dictionary.json')
    .then(res => res.json())
    .then(data => {dict = data;});

fetch('../resources/data/dictionary/forms.json')
    .then(res => res.json())
    .then(data => {formdata = data;});

fetch('../resources/data/dictionary/redirects.json')
    .then(res => res.json())
    .then(data => {redirects = data;});

const HTML = document.querySelector("html"),
dictionary = document.querySelector(".dictionary-container"),
Search = dictionary.querySelector(".search"),
searchBar = Search.querySelector("input"),
infoText = dictionary.querySelector(".info-text"),
container = dictionary.querySelector(".dictionary-container ul"),
Warning = dictionary.querySelector(".warning"),
Word = dictionary.querySelector(".word"),
Notes = dictionary.querySelector(".notes"),
Meaning = dictionary.querySelector(".meaning"),
Forms = dictionary.querySelector(".forms"),
searchButton = dictionary.querySelector(".search i"),
Xbutton = dictionary.querySelector(".search span");

function createInteractiveDropdown(parent,title){
    var section = document.createElement("div");
    section.classList.add("interactive-dropdown-container");
    section.innerHTML = `<aside><blockquote>${title}</blockquote><i class="fa fa-caret-right"></i></aside>`;

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

function createSubTable(parent,title=""){
    var section = document.createElement("table");
    section.classList.add("subtable");

    if(title) section.insertAdjacentHTML("beforeend",`<caption>${title}</caption>`)
    
    parent.appendChild(section);
    return section;
}

function form(table, word, result, exceptions={}, recursed=false){
    if(result["declension"] === "indeclinable") return false;

    if(result["type"] === "noun"){
        var dat = formdata["noun"], root, subtable;

        if(result["declension"] === "I"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1-!!exceptions["plural"]);
            dat = dat["I"];
        } else if(result["declension"] === "II"){
            if(exceptions["plural"]){
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1);
                dat = dat["II"][result["gender"] === "m" ? "us" : "um"];
            } else {
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2+(word.charAt(word.length-1) === "r"));
                dat = dat["II"][word.charAt(word.length-1) === "r" ? "r" : "u"+word.charAt(word.length-1)];
            }
        } else if(result["declension"] === "III"){
            root = exceptions["root"] ? exceptions["root"] : result["root"];
            dat = dat["III"][result["gender"] == "n" ? "n" : "!n"];
        } else if(result["declension"] === "IV"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2);
            dat = dat["IV"];
        } else if(result["declension"] === "V"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2);
            dat = dat["V"];
        }

        if(exceptions["plural"]){
            subtable = createSubTable(table);

            subtable.insertAdjacentHTML("beforeend",`<tr><th></th><th>pl.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${word}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + (result["gender"] === "n" && exceptions["i-stem"] ? "<b>i</b>" : "") + dat["plural"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${root + (exceptions["i-stem"] ? "<b>i</b>" : "") + dat["plural"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + dat["plural"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${root + dat["plural"]["dative"]}</td></tr>`);
        } else {
            subtable = createSubTable(table);

            subtable.insertAdjacentHTML("beforeend",`<tr><th></th><th>s.</th><th>pl.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${word}</td><td>${root + (result["gender"] === "n" && exceptions["i-stem"] ? "<b>i</b>" : "") + dat["plural"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${dat["singular"]["accusative"] ? root + dat["singular"]["accusative"] : word}</td><td>${root + (result["gender"] === "n" && exceptions["i-stem"] ? "<b>i</b>" : "") + dat["plural"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${root + dat["singular"]["genitive"]}</td><td>${root + (exceptions["i-stem"] ? "<b>i</b>" : "") + dat["plural"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + (exceptions["abl-i-stem"] ? "<b>ī</b>" : dat["singular"]["ablative"])}</td><td>${root + dat["plural"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${root + dat["singular"]["dative"]}</td><td>${root + dat["plural"]["dative"]}</td></tr>`);
        }
    } else if(result["type"] === "verb"){
        var dat = formdata["verb"][result["declension"]], subdat, linked, newRoot, subtable, root;

        if(result["declension"] === "irreg"){
            root = word.substring(0, word.length - result["base"].length);
            dat = dat[result["base"]];
        }
        else root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1-(result["declension"] === "II" || result["declension"] === "III spec" || result["declension"] === "IV"));

        var container, content;
        
        container = createInteractiveDropdown(table,"Active");
        content = document.createElement("table");
        content.classList.add("gridtable");
        content.insertAdjacentHTML("beforeend",`<tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td colspan="2"></td></tr>`);
        
        subtable = createSubTable(content.rows[0].cells[0],"Present (Imperfect)");
        subdat = dat["active"]["present"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[0].cells[1],"Present Perfect (Aorist)");
        subdat = formdata["verb"]["aorist"]["active"];
        newRoot = result["perfect-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        if(dat["active"]["irregular-imperfect"]){
            subtable = createSubTable(content.rows[1].cells[0],"Past Imperfect");
            subdat = dat["active"]["past"];
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

            subtable = createSubTable(content.rows[2].cells[0],"Future Imperfect");
            subdat = dat["active"]["future"];
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

        } else {
            subtable = createSubTable(content.rows[1].cells[0],"Past Imperfect");
            subdat = formdata["verb"]["imperfect"]["active"]["past"];
            linked = root + (dat["imperfect-root"] ? dat["imperfect-root"] : "") + dat["past-imperfect-link"];
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

            subtable = createSubTable(content.rows[2].cells[0],"Future Imperfect");
            subdat = formdata["verb"]["imperfect"]["active"]["future"][result["declension"] === "I" || result["declension"] === "II" || (result["declension"] === "irreg" && dat["similar-declension"] === "I~II") ? "I~II" : "!I~II"];
            linked = root + (dat["imperfect-root"] ? dat["imperfect-root"] : "") + dat["future-imperfect-link"];
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);
        }

        subtable = createSubTable(content.rows[1].cells[1],"Past Perfect");
        subdat = formdata["verb"]["perfect"]["active"]["past"];
        newRoot = result["perfect-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[2].cells[1],"Future Perfect");
        subdat = formdata["verb"]["perfect"]["active"]["future"];
        newRoot = result["perfect-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[3].cells[0],"Infinitive");
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${result["infinitive"]}</td><td>${result["perfect-root"]+"isse"}</td><td>${exceptions["future-infinitive"] ? `<b>${exceptions["future-infinitive"]}</b>` : result["perfect-passive-participle"]?result["perfect-passive-participle"]+"ūrum esse":"-"}</td></tr>`);

        container.appendChild(content);

        container = createInteractiveDropdown(table,"Passive");
        content = document.createElement("table");
        content.classList.add("gridtable");
        if(exceptions["intransitive"]) createSubTable(content,"no passive");
        else {
            content.insertAdjacentHTML("beforeend",`<tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td colspan="2"></td></tr>`);
            if(exceptions["limited-passive"]){
                subtable = createSubTable(content.rows[0].cells[0],"Present (Imperfect)");
                subdat = dat["passive"]["present"];
                subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["3s"]}</td><td>-</td></tr>`);

                subtable = createSubTable(content.rows[0].cells[1],"Present Perfect (Aorist)");
                if(result["perfect-passive-participle"]){
                    subdat = formdata["verb"]["aorist"]["passive"];
                    newRoot = result["perfect-passive-participle"];
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>-</td></tr>`);
                } else subtable.insertAdjacentHTML("beforeend",`<tfoot><tr><td colspan="2">no present perfect (aorist)</td></tr><tr><td>&nbsp</td></tr><tr><td>&nbsp</td></tr></tfoot>`);

                subtable = createSubTable(content.rows[1].cells[0],"Past Imperfect");
                subdat = formdata["verb"]["imperfect"]["passive"]["past"];
                linked = root + dat["past-imperfect-link"];
                subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>-</td></tr>`);

                subtable = createSubTable(content.rows[2].cells[0],"Future Imperfect");
                subdat = formdata["verb"]["imperfect"]["passive"]["future"][result["declension"] === "I" || result["declension"] === "II" || (result["declension"] === "irreg" && dat["similar-declension"] === "I~II") ? "I~II" : "!I~II"];
                linked = root + dat["future-imperfect-link"];
                subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>-</td></tr>`);

                subtable = createSubTable(content.rows[1].cells[1],"Past Perfect");
                if(result["perfect-passive-participle"]){
                    subdat = formdata["verb"]["perfect"]["passive"]["past"];
                    newRoot =  result["perfect-passive-participle"];
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>-</td></tr>`);
                } else subtable.insertAdjacentHTML("beforeend",`<tfoot><tr><td colspan="2">no past perfect</td></tr><tr><td>&nbsp</td></tr><tr><td>&nbsp</td></tr></tfoot>`);
                
                subtable = createSubTable(content.rows[2].cells[1],"Future Perfect");
                if(result["perfect-passive-participle"]){
                    subdat = formdata["verb"]["perfect"]["passive"]["future"];
                    newRoot =  result["perfect-passive-participle"];
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>-</td></tr>`);
                } else subtable.insertAdjacentHTML("beforeend",`<tfoot><tr><td colspan="2">no future perfect</td></tr><tr><td>&nbsp</td></tr><tr><td>&nbsp</td></tr></tfoot>`);

                subtable = createSubTable(content.rows[3].cells[0],"Infinitive");
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + dat["passive-infinitive-ending"]}</td><td>-</td><td>-</td></tr>`);
            } else {
                subtable = createSubTable(content.rows[0].cells[0],"Present (Imperfect)");
                subdat = dat["passive"]["present"];
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

                subtable = createSubTable(content.rows[0].cells[1],"Present Perfect (Aorist)");
                if(result["perfect-passive-participle"]){
                    subdat = formdata["verb"]["aorist"]["passive"];
                    newRoot = result["perfect-passive-participle"];
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);
                } else subtable.insertAdjacentHTML("beforeend",`<tfoot><tr><td colspan="2">no present perfect (aorist)</td></tr><tr><td>&nbsp</td></tr><tr><td>&nbsp</td></tr></tfoot>`);

                subtable = createSubTable(content.rows[1].cells[0],"Past Imperfect");
                subdat = formdata["verb"]["imperfect"]["passive"]["past"];
                linked = root + (dat["imperfect-root"] ? dat["imperfect-root"] : "") + dat["past-imperfect-link"];
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

                subtable = createSubTable(content.rows[2].cells[0],"Future Imperfect");
                subdat = formdata["verb"]["imperfect"]["passive"]["future"][result["declension"] === "I" || result["declension"] === "II" ? "I~II" : "!I~II"];
                linked = root + (dat["imperfect-root"] ? dat["imperfect-root"] : "") + dat["future-imperfect-link"];
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

                subtable = createSubTable(content.rows[1].cells[1],"Past Perfect");
                if(result["perfect-passive-participle"]){
                    subdat = formdata["verb"]["perfect"]["passive"]["past"];
                    newRoot =  result["perfect-passive-participle"];
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);
                } else subtable.insertAdjacentHTML("beforeend",`<tfoot><tr><td colspan="2">no past perfect</td></tr><tr><td>&nbsp</td></tr><tr><td>&nbsp</td></tr></tfoot>`);
                
                subtable = createSubTable(content.rows[2].cells[1],"Future Perfect");
                if(result["perfect-passive-participle"]){
                    subdat = formdata["verb"]["perfect"]["passive"]["future"];
                    newRoot =  result["perfect-passive-participle"];
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);
                } else subtable.insertAdjacentHTML("beforeend",`<tfoot><tr><td colspan="2">no future perfect</td></tr><tr><td>&nbsp</td></tr><tr><td>&nbsp</td></tr></tfoot>`);
            
                subtable = createSubTable(content.rows[3].cells[0],"Infinitive");
                subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + dat["passive-infinitive-ending"]}</td><td>${result["perfect-passive-participle"] ? result["perfect-passive-participle"] + "um esse" : "-"}</td><td>${result["perfect-passive-participle"] ? result["perfect-passive-participle"] + `<b>um</b> īrī` : "-"}</td></tr>`);
            }
        }

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Participle");
        content = document.createElement("table");

        if(result["declension"] !== "irreg"){
            subtable = createSubTable(content,"Present");
            form(subtable, root + dat["present-participle-link"] + "ns", {"type":"adjective","declension":"III"}, {}, true);
        } else if(dat["present-participle"]){
            subtable = createSubTable(content,"Present");
            if(typeof dat["present-participle"] === "string") form(subtable, root + dat["present-participle"], {"type":"adjective","declension":"III"}, true);
            else form(subtable, root + dat["present-participle"]["content"], {"type":"adjective","declension":"III"},{"root" :root + dat["present-participle"]["root"]}, true);
        } 

        if(result["perfect-passive-participle"]){
            subtable = createSubTable(content,"Perfect Passive");
            form(subtable, result["perfect-passive-participle"] + "us", {"type":"adjective","declension":"I~II"}, {}, true);
        } else {
            if(content.children.length == 0) createSubTable(content,"no participle");
            else createSubTable(content,"Perfect Passive").insertAdjacentHTML("beforeend",`<tfoot><tr><td>no perfect (aorist) passive</td></tr></tfoot>`);
        }

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Imperative");
        content = document.createElement("table");

        if(dat["imperative"]){
            subtable = createSubTable(content,"Present");
            
            subdat = dat["imperative"]["present"];
            subtable.insertAdjacentHTML("beforeend",`<tr><td>${exceptions["irreg-imperative"] ? "<b>" + root + (result["declension"] === "irreg" ? subdat["2s"] : "") + "</b>" : root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td><td>${root + subdat["1p"]}</td></tr>`);
        } else createSubTable(content,"no imperative");

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Subjunctive");
        content = document.createElement("table");
        content.insertAdjacentHTML("beforeend",`<tr><td></td><tr>`);

        subtable = createSubTable(content.rows[0].cells[0],"Present (Imperfect)")
        linked = root + (dat["subjunctive-root"] ? dat["subjunctive-root"] : "") + dat["subjunctive-link"]
        newRoot = root + (dat["subjunctive-root"] ? dat["subjunctive-root"] : "") + normalize(dat["subjunctive-link"])
        subdat = formdata["verb"]["subjunctive"]["active"]["present"]
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        container.appendChild(content);

    } else if(result["type"] === "deponent verb"){
        var dat = formdata["verb"][result["declension"].substring(0,result["declension"].length-4)], subdat, linked, newRoot, subtable, root;
        root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2-(result["declension"] === "II dep" || result["declension"] === "III spec dep" || result["declension"] === "IV dep"));

        var container, content;
        
        container = createInteractiveDropdown(table,"Active");
        content = document.createElement("table");
        content.classList.add("gridtable");
        content.insertAdjacentHTML("beforeend",`<tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td colspan="2"></td></tr>`);
        
        subtable = createSubTable(content.rows[0].cells[0],"Present (Imperfect)");
        subdat = dat["passive"]["present"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["1s"]}</td><td>${root + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["2s"]}</td><td>${root + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["3s"]}</td><td>${root + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[0].cells[1],"Present Perfect (Aorist)");
        subdat = formdata["verb"]["aorist"]["passive"];
        newRoot = result["perfect-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[1].cells[0],"Past Imperfect");
        subdat = formdata["verb"]["imperfect"]["passive"]["past"];
        linked = root + dat["past-imperfect-link"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[2].cells[0],"Future Imperfect");
        subdat = formdata["verb"]["imperfect"]["passive"]["future"][result["declension"] === "I dep" || result["declension"] === "II dep" ? "I~II" : "!I~II"];
        linked = root + dat["future-imperfect-link"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["1s"]}</td><td>${linked + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["2s"]}</td><td>${linked + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${linked + subdat["3s"]}</td><td>${linked + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[1].cells[1],"Past Perfect");
        subdat = formdata["verb"]["perfect"]["passive"]["past"];
        newRoot =  result["perfect-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);
        
        subtable = createSubTable(content.rows[2].cells[1],"Future Perfect");
        subdat = formdata["verb"]["perfect"]["passive"]["future"];
        newRoot =  result["perfect-root"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["1s"]}</td><td>${newRoot + subdat["1p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["2s"]}</td><td>${newRoot + subdat["2p"]}</td></tr>`);
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${newRoot + subdat["3s"]}</td><td>${newRoot + subdat["3p"]}</td></tr>`);

        subtable = createSubTable(content.rows[3].cells[0],"Infinitive");
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${result["infinitive"]}</td><td>${result["perfect-root"]+"um esse"}</td><td>${(exceptions["future-infinitive"] ? `<b>${exceptions["future-infinitive"]}</b>` : result["perfect-root"])+"ūrum esse"}</td></tr>`);

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Passive");
        content = document.createElement("table");
        content.classList.add("gridtable");
        createSubTable(content,"no passive");
        container.appendChild(content);


        container = createInteractiveDropdown(table,"Participle");
        content = document.createElement("table");

        subtable = createSubTable(content,"Present");
        form(subtable, root + dat["present-participle-link"] + "ns", {"type":"adjective","declension":"III"}, {}, true);

        subtable = createSubTable(content,"Perfect Passive");
        form(subtable, result["perfect-root"] + "us", {"type":"adjective","declension":"I~II"}, {}, true);

        container.appendChild(content);


        container = createInteractiveDropdown(table,"Imperative");
        content = document.createElement("table");
        subtable = createSubTable(content,"Present");
        
        subdat = dat["passive"]["present"];
        subtable.insertAdjacentHTML("beforeend",`<tr><td>${root + subdat["2s"].substring(0,subdat["2s"].length-2) + "e"}</td><td>${root + subdat["2p"]}</td></tr>`);

        container.appendChild(content);

    } else if(result["type"] === "adjective"){
        var dat = formdata["adjective"], subdat, root, container, content, subtable;

        if(result["declension"] === "I~II"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2) + (word.charAt(word.length-1) === "r" ? "r" : "");
            dat = dat["I~II"];

            subtable = createSubTable(table);
            subdat = dat["singular"];
            subtable.insertAdjacentHTML("beforeend",`<tr><th><b>s.</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${root + subdat["f"]["nominative"]}</td><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + subdat["f"]["accusative"]}</td><td>${root + subdat["m"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["f"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["m"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + subdat["f"]["ablative"]}</td><td>${root + subdat["m"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["f"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["m"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);

        
            subtable = createSubTable(table);
            subdat = dat["plural"];
            subtable.insertAdjacentHTML("beforeend",`<tr><th><b>pl.</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${root + subdat["f"]["nominative"]}</td><td>${root + subdat["m"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + subdat["f"]["accusative"]}</td><td>${root + subdat["m"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${root + subdat["f"]["genitive"]}</td><td>${root + subdat["m"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + subdat["f"]["ablative"]}</td><td>${root + subdat["m"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${root + subdat["f"]["dative"]}</td><td>${root + subdat["m"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);
        } else if(result["declension"] === "III"){
            dat = dat["III"];
            subdat = dat["singular"];
            subtable = createSubTable(table);

            if(word.charAt(word.length-2) === "e" && word.charAt(word.length-1) === "r"){
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2) + "r";
                
                subtable.insertAdjacentHTML("beforeend",`</th><th><b>s.</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${root + subdat["!n"]["nominative"]}</td><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);

            } else if((word.charAt(word.length-2) === "n" && word.charAt(word.length-1) === "s") || word.charAt(word.length-1) === "x" || word.charAt(word.length-1) === "r"){
                root = exceptions["root"] ? exceptions["root"] : (word.charAt(word.length-1) === "r" ? word.substring(0,word.length-2) + normalize(word.charAt(word.length-2)) + "r" : word.charAt(word.length-1) === "x" ? word.substring(0,word.length-1) + "c" : word.substring(0,word.length-3) + normalize(word.charAt(word.length-3)) + "nt");

                subtable.insertAdjacentHTML("beforeend",`</th><th><b>s.</b></th><th>f./m.</th><th>n.</th></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${word}</td><td>${word}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + subdat["!n"]["accusative"]}</td><td>${word}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);
            } else {
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2)

                subtable.insertAdjacentHTML("beforeend",`</th><th><b>s.</b></th><th>f./m.</th><th>n.</th></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${word}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["!n"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : root + subdat["n"]["genitive"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
                subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["!n"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : root + subdat["n"]["dative"]}</td></tr>`);
            }

            subtable = createSubTable(table);
            subdat = dat["plural"];
            subtable.insertAdjacentHTML("beforeend",`</th><th><b>pl.</b></th><th>f./m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${root + subdat["!n"]["nominative"]}</td><td>${root + subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${root + subdat["!n"]["accusative"]}</td><td>${root + subdat["n"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${root + subdat["!n"]["genitive"]}</td><td>${root + subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${root + subdat["!n"]["ablative"]}</td><td>${root + subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${root + subdat["!n"]["dative"]}</td><td>${root + subdat["n"]["dative"]}</td></tr>`);
        }

        if(!recursed){
            container = createInteractiveDropdown(table,"Comparative");
            content = document.createElement("table");

            if(exceptions["no-comparative"]) createSubTable(content,"no comparative");
            else {
                if(exceptions["wtf-extremely-irregular-anomaly"]){
                    var newWord = exceptions["comparative"],
                    newRoot = newWord.substring(0,newWord.length-1) + "r",

                    subtable = createSubTable(content);
                    subdat = formdata["adjective"]["III"]["singular"];
                    subtable.insertAdjacentHTML("beforeend",`</th><th><b>s.</b></th><th>f./m.</th><th>n.</th></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${newWord}</td><td>${newWord}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${newWord}</td><td>${newWord}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${newRoot + subdat["!n"]["genitive"]}</td><td>${newRoot + subdat["n"]["genitive"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>-</td><td>-</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>-</td><td>-</td></tr>`);

                    subtable = createSubTable(content);
                    subdat = formdata["adjective"]["III"]["plural"];
                    subtable.insertAdjacentHTML("beforeend",`</th><th><b>pl.</b></th><th>f./m.</th><th>n.</th></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${newRoot + subdat["!n"]["nominative"]}</td><td>${newRoot + subdat["n"]["nominative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${newRoot + subdat["!n"]["accusative"]}</td><td>${newRoot + subdat["n"]["accusative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${newRoot + subdat["!n"]["genitive"]}</td><td>${newRoot + subdat["n"]["genitive"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${newRoot + subdat["!n"]["ablative"]}</td><td>${newRoot + subdat["n"]["ablative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${newRoot + subdat["!n"]["dative"]}</td><td>${newRoot + subdat["n"]["dative"]}</td></tr>`);

                } else {
                    var newWord = exceptions["comparative"] ? exceptions["comparative"] : root + "ior" ,
                    newRoot = newWord.substring(0,newWord.length-2) + "ōr",
                    nRoot = newRoot.substring(0,newRoot.length-2) + "us";

                    subtable = createSubTable(content);
                    subdat = formdata["adjective"]["comparative"]["singular"];
                    subtable.insertAdjacentHTML("beforeend",`</th><th><b>s.</b></th><th>f./m.</th><th>n.</th></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${newWord}</td><td>${nRoot}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${newRoot + subdat["!n"]["accusative"]}</td><td>${nRoot}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${newRoot + subdat["!n"]["genitive"]}</td><td>${newRoot + subdat["n"]["genitive"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${newRoot + subdat["!n"]["ablative"]}</td><td>${newRoot + subdat["!n"]["ablative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${newRoot + subdat["!n"]["dative"]}</td><td>${newRoot + subdat["n"]["dative"]}</td></tr>`);

                    subtable = createSubTable(content);
                    subdat = formdata["adjective"]["comparative"]["plural"];
                    subtable.insertAdjacentHTML("beforeend",`</th><th><b>pl.</b></th><th>f./m.</th><th>n.</th></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${newRoot + subdat["!n"]["nominative"]}</td><td>${newRoot + subdat["n"]["nominative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${newRoot + subdat["!n"]["accusative"]}</td><td>${newRoot + subdat["n"]["accusative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${newRoot + subdat["!n"]["genitive"]}</td><td>${newRoot + subdat["!n"]["genitive"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${newRoot + subdat["!n"]["ablative"]}</td><td>${newRoot + subdat["n"]["ablative"]}</td></tr>`);
                    subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${newRoot + subdat["!n"]["dative"]}</td><td>${newRoot + subdat["n"]["dative"]}</td></tr>`);
                }
            }

            container.appendChild(content);

            container = createInteractiveDropdown(table,"Superlative");
            content = document.createElement("table");

            if(exceptions["no-superlative"]) createSubTable(content,"no superlative");
            else form(content,exceptions["superlative"] ? exceptions["superlative"] : root + "issimus",{"type":"adjective","declension":"I~II"},{},true);

            container.appendChild(content);
        }

    } else if(result["type"] === "pronoun"){
        var dat = formdata["pronoun"][word], subdat;

        if(dat["gender-specific"]){
            subtable = createSubTable(table);
            subdat = dat["singular"];
            subtable.insertAdjacentHTML("beforeend",`<tr><th><b>s.</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${subdat["f"]["nominative"]}</td><td>${subdat["m"]["nominative"]}</td><td>${subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${subdat["f"]["accusative"]}</td><td>${subdat["m"]["accusative"]}</td><td>${subdat["n"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : subdat["f"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : subdat["m"]["genitive"]}</td><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${subdat["f"]["ablative"]}</td><td>${subdat["m"]["ablative"]}</td><td>${subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : subdat["f"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : subdat["m"]["dative"]}</td><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : subdat["n"]["dative"]}</td></tr>`);
        
            subtable = createSubTable(table);
            subdat = dat["plural"];
            subtable.insertAdjacentHTML("beforeend",`<tr><th><b>pl.</b></th><th>f.</th><th>m.</th><th>n.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${subdat["f"]["nominative"]}</td><td>${subdat["m"]["nominative"]}</td><td>${subdat["n"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${subdat["f"]["accusative"]}</td><td>${subdat["m"]["accusative"]}</td><td>${subdat["n"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${subdat["f"]["genitive"]}</td><td>${subdat["m"]["genitive"]}</td><td>${subdat["n"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${subdat["f"]["ablative"]}</td><td>${subdat["m"]["ablative"]}</td><td>${subdat["n"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${subdat["f"]["dative"]}</td><td>${subdat["m"]["dative"]}</td><td>${subdat["n"]["dative"]}</td></tr>`);
        } else {
            subtable = createSubTable(table);
            subtable.insertAdjacentHTML("beforeend",`<tr><th></th><th>s.</th><th>pl.</th></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Nom.</th><td>${dat["singular"]["nominative"]}</td><td>${dat["plural"]["nominative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Acc.</th><td>${dat["singular"]["accusative"]}</td><td>${dat["plural"]["accusative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Gen.</th><td>${exceptions["sfg"] ? "<b>"+exceptions["sfg"]+"</b>" : dat["singular"]["genitive"]}</td><td>${dat["plural"]["genitive"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Abl.</th><td>${dat["singular"]["ablative"]}</td><td>${dat["plural"]["ablative"]}</td></tr>`);
            subtable.insertAdjacentHTML("beforeend",`<tr><th>Dat.</th><td>${exceptions["sfd"] ? "<b>"+exceptions["sfd"]+"</b>" : dat["singular"]["dative"]}</td><td>${dat["plural"]["dative"]}</td></tr>`);
        }
    } else return false;
    return true;
}

function processWord(word){
    var aliases = [];

    var plural = word.match(/(?<=\(pl\. ).+?(?=\))/);
    if(plural !== null)
        aliases.push(plural[0]);
    
    word = word.replace(/ ?\(pl\..+?\) ?/,"");
    var alias = word.replace(/ ?\((?!i\.e\.|f\.|m\.|n\.|modal|sing\. unit).*?\) ?/,"");
    if(alias !== word) aliases.push(alias);
    aliases.push(word.replace(/(?<=\((?!i\.e\.|f\.|m\.|n\.|modal|sing\. unit).+?)\)/,"").replace(/\((?!i\.e\.|f\.|m\.|n\.|modal|sing\. unit)/,""));
    return aliases;
}

function generateRedirects(){
    var temp, result, exceptions, cells, redirect, redirects_={};
    for(const word in dict){
        console.log(word);
        temp = document.createElement("table");
        
        var result_ = dict[word];
        result_ = result_["multiple-definitions"] ? result_["content"] : {"":result_};

        for(var key in result_){
            var result = result_[key];

            if(result["flag"]) continue;

            exceptions = result["exceptions"] ? result["exceptions"] : {};

            var parts_ = parts(word, result, exceptions);
            for(const part in parts_){
                redirect = parts_[part];
                if(redirect !== word){
                    if(redirects_[redirect]){
                        if(key){
                            redirects_[redirect][word+">"+key] = {"word":word,"key":key};
                        } else {
                            redirects_[redirect][word] = word;
                        }
                    } else {
                        if(key){
                            redirects_[redirect] = {[word+">"+key]:{"word":word,"key":key}};
                        } else {
                            redirects_[redirect] = {[word]:word};
                        }
                    }
                }
            }

            var defs;
            if(result["type"] === "verb" || result["type"] === "deponent verb" || result["type"] === "special") defs = result["meaning"].replace("to ","");
            else defs = result["meaning"];
            defs = defs.split(", ").map(processWord).flat(Infinity);

            if(result["type"] === "verb" || result["type"] === "deponent verb" || (result["type"] === "special" && result["meaning"].substring(0,3) === "to ")) defs = defs.concat(defs.map((e) => "to "+e));

            for(const def in defs){
                redirect = defs[def];
                if(redirect !== word){
                    if(redirects_[redirect]){
                        if(key){
                            redirects_[redirect][word+">"+key] = {"word":word,"key":key};
                        } else {
                            redirects_[redirect][word] = word;
                        }
                    } else {
                        if(key){
                            redirects_[redirect] = {[word+">"+key]:{"word":word,"key":key}};
                        } else {
                            redirects_[redirect] = {[word]:word};
                        }
                    }
                }
            }

            form(temp,word,result,exceptions);

            cells = temp.querySelectorAll("table.subtable > tbody > tr > td");

            for(const cell in cells){
                redirect = cells[cell].innerText;
                if(!redirect || redirect === "-") continue;
                if(redirect !== word){
                    if(redirects_[redirect]){
                        if(key){
                            redirects_[redirect][word+">"+key] = {"word":word,"key":key};
                        } else {
                            redirects_[redirect][word] = word;
                        }
                    } else {
                        if(key){
                            redirects_[redirect] = {[word+">"+key]:{"word":word,"key":key}};
                        } else {
                            redirects_[redirect] = {[word]:word};
                        }
                    }
                }
            }
        }
    }

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(redirects_));
    var dlAnchorElem = document.getElementById("downloadAnchorElem");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "redirects.json");
    dlAnchorElem.click();
}

function parts(word, result, exceptions){
    if(result["flag"]) return [word];

    if(result["type"] === "noun"){
        var dat = formdata["noun"], root;

        if(result["declension"] === "I"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1-!!exceptions["plural"]);
            dat = dat["I"];
        } else if(result["declension"] === "II"){
            if(exceptions["plural"]){
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-1);
                dat = dat["II"][result["gender"] === "m" ? "us" : "um"];
            } else {
                root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2+(word.charAt(word.length-1) === "r"));
                dat = dat["II"][word.charAt(word.length-1) === "r" ? "r" : "u"+word.charAt(word.length-1)];
            }
        } else if(result["declension"] === "III"){
            root = exceptions["root"] ? exceptions["root"] : result["root"];
            dat = dat["III"][result["gender"] == "n" ? "n" : "!n"];
        } else if(result["declension"] === "IV"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2);
            dat = dat["IV"];
        } else if(result["declension"] === "V"){
            root = exceptions["root"] ? exceptions["root"] : word.substring(0,word.length-2);
            dat = dat["V"];
        } else if(result["declension"] === "indeclinable"){
            return [word];
        }

        if(exceptions["plural"]) return [word, root + (exceptions["i-stem"] ? "i" : "") + dat["plural"]["genitive"]]
        
        return [word, root + dat["singular"]["genitive"]];

    } else if(result["type"] === "verb"){
        var res = [word, result["infinitive"], result["perfect-root"]+"ī"];
        if(result["perfect-passive-participle"]) res.push(result["perfect-passive-participle"] + "um");
        return res;
    } else if(result["type"] === "deponent verb"){
        return [word, result["infinitive"], result["perfect-root"]+"us sum"];
    }
    
    return word.split(", ");
}

function search(word, key=""){
    if(word === "verysecretpasswordthatnobodywilleverfindunlesstheycheckthesourcecode" && !HTML.classList.contains("goofy")){
        infoText.innerHTML = `what is bro cooking`;

        setTimeout(() => {
            HTML.classList.add("goofy");
        }, 1000);

        searching = false;
        return;
    } else if(word === "verysecretdisablingcodethatnobodywilleverfindunlesstheycheckthesourcecode" && HTML.classList.contains("goofy")){
        infoText.innerHTML = `THANK YOU I WAS DEVELOPING BRAIN CANCER`;
        HTML.classList.remove("goofy");
        searching = false;
        return;
    } else if(word === "omnibus noctibus"){
        infoText.innerHTML = `im sorry but daniel cui requested this to be added\n[easter egg removed :(]`;
        dictionary.classList.remove("active");
        searching = false;
        return;
    } else if(word === "\u0073\u0075\u0062\u0073\u0063\u0072\u0069\u0062\u0065\u0020\u0074\u006f\u0020\u0073\u0075\u0063\u0072\u0061\u006d\u0033\u0031\u0034"){
        infoText.innerHTML = "\u0079\u0065\u0073\u0020\u0070\u006c\u0065\u0061\u0073\u0065";
        var amogus = document.getElementsByTagName("\u002a");
        for(var i=0; i<amogus.length; i++){
            var amogussy = Math.floor(Math.random() * 256),
            amogussier = Math.floor(Math.random() * 256),
            amogussiest = Math.floor(Math.random() * 256);

            amogus[i].style.color = `rgb(${amogussy},${amogussier},${amogussiest})`
            amogus[i].style["background-color"] = `rgb(${255-amogussy},${255-amogussier},${255-amogussiest})`;
        }

        dictionary.classList.remove("active");
        searching = false;
        return;
    }
    
    if(current_word === word && current_key === key){
        infoText.innerHTML = `Results for "<span>${word}</span>"${(key ? ` (${key})` : "") + (redirected ? ` redirected from "<span>${redirected}</span>"`:"")}`;
        searching = false;
        return;
    }

    dictionary.classList.remove("active");
    
    infoText.innerHTML = `Fetching data for "<span>${word}</span>"${(key ? ` (${key})` : "") + (redirected ? ` redirected from "<span>${redirected}</span>"`:"")} ...`;

    var result = dict[word];

    if(result === undefined){
        current_word = "";
        current_key = "";
        searching = false;
        infoText.innerHTML = `Could not find the word "<span>${(word.length > 20 ? word.substring(0,20) + "..." : word)}</span>" - consider checking the spelling?<br>(or requesting a word to be added)`
        return;
    }

    if(result["multiple-definitions"]) result = result["content"][key];

    setTimeout(() => {
        searching = false;

        current_word = word;
        current_key = key;
        infoText.innerHTML = `Results for "<span>${word}</span>"${(key ? ` (${key})` : "") + (redirected ? ` redirected from "<span>${redirected}</span>"`:"")}`;
        Warning.classList.remove("active");
        Notes.classList.remove("active");
        dictionary.classList.add("active");

        var exceptions = result["exceptions"] ? result["exceptions"] : {};
    
        Word.querySelector("p").innerText = parts(word, result, exceptions).join(", ");
        Word.querySelector("span").innerText = result["type"].replace(/deponent /,"") + (result["declension"] ? " / " + result["declension"] : "") + (result["gender"] ? " / " + result["gender"] + "." : "")
        Meaning.querySelector(".details span").innerText = result["meaning"];

        if(result["flag"]){
            Warning.classList.add("active");
            Warning.querySelector("span").innerHTML = `The following entry has been flagged for further review. <br><br> Reason: <b>${result["flag"]}</b> <br><br> Please take this entry <i>cum granō salis</i>.`;
            Forms.classList.remove("active");
            return;
        }

        if(result["notes"]){
            Notes.classList.add("active");
            Notes.querySelector("span").innerText = " •  " + result["notes"].join("\n •  ");
        }

        Forms.classList.add("active");
        var table = Forms.querySelector("table");
        table.replaceChildren();

        if(!form(table,word,result,exceptions)) Forms.classList.remove("active");

    }, 420 + Math.random()*69);
}

function closeAllLists() {
    var x = Search.querySelector(".autocomplete-list");
    if(!x) return;
    x.replaceChildren();
    Search.removeChild(x);
}

function normalize(word){
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function searchTopResult(){
    var x = Search.querySelector(".autocomplete-list"), word, key, redirect;
    if(x && x.children.length){
        x = x.children[0];

        word = x.querySelector(".word"),
        key = x.querySelector(".key"),
        redirect = x.querySelector(".redirect");

        searchBar.value = word.value;
        if(redirect) redirected = redirect.value;
    }
    closeAllLists();
    searchBar.blur();
    searching = true;
    search(searchBar.value, key ? key.value : "");
}

searchBar.addEventListener("keydown", function(e) {
    if(e.key === "Enter" && e.target.value && !searching)
        searchTopResult();
})

searchBar.addEventListener("input",function(e){
    var a, b, val = this.value;

    closeAllLists();
    if(!val) return;

    a = document.createElement("div");
    a.classList.add("autocomplete-list");

    Search.appendChild(a);

    var suggestions = 0, suggested={};

    for(const word in dict) {
        var flag = false, whitespace = true, i=0, j=0;

        for(i=0; i<val.length; ++i){
            if(j == word.length){
                flag = true;
                break;
            }

            if(val.charAt(i) === ","){
                if(word.charAt(j) === ","){
                    ++j;
                    continue;
                }
                flag = true;
                break;
            }

            if(val.charAt(i) === " "){
                if(word.charAt(j) === " ") ++j;
                continue;
            }

            if(word.charAt(j) === "," || word.charAt(j) === " "){
                ++j;
                --i;
                continue;
            }

            whitespace = false;

            if("āēīōū".includes(val.charAt(i).toLowerCase())){
                if(val.charAt(i).toLowerCase() != word.charAt(j).toLowerCase()){
                    flag = true;
                    break;
                }
            } else if(val.charAt(i).toLowerCase() != normalize(word.charAt(j)).toLowerCase()){
                flag = true;
                break;
            }

            ++j;
        }

        if(flag || whitespace) continue;

        var defs = dict[word]["multiple-definitions"] ? dict[word]["content"] : {"":dict[word]};

        for(const key in defs){
            b = document.createElement("div");

            b.innerHTML = `<b>${word.substring(0, j)}</b>${word.substring(j) + (key ? " (" + key + ")" : "")}`;
            b.innerHTML += `<input type="hidden" value="${word}" class="word">`;
            if(key) b.innerHTML += `<input type="hidden" value="${key}" class="key">`;

            b.addEventListener("click", function(e) {
                var word = this.querySelector(".word"),
                key = this.querySelector(".key");

                searchBar.value = word.value;
                if(!searching){
                    searching = true;
                    redirected = false;
                    search(searchBar.value, key ? key.value : "");
                }
                closeAllLists();
            });
            if(j == word.length){
                a.prepend(b);
                if(++suggestions > MAXSUGGESTIONS)
                    a.removeChild(a.lastChild);
            } else if(suggestions < MAXSUGGESTIONS){
                a.appendChild(b);
                ++suggestions;
            }

            suggested[word] = true;
        }
    }

    for(const word in redirects) {
        // for(const redirect in redirects[word]){
        //     var toword, key;
        //     if(typeof redirects[word][redirect] == "string"){
        //         toword = redirects[word][0];
        //         key = redirects[word][1];
        //     }
        //     else toword = redirects[word][redirect];

        //     if(suggested[toword]) continue;

        var flag = false, whitespace = true, i=0, j=0;

        for(i=0; i<val.length; ++i){
            if(j == word.length){
                flag = true;
                break;
            }

            if(val.charAt(i) === ","){
                if(word.charAt(j) === ","){
                    ++j;
                    continue;
                }
                flag = true;
                break;
            }

            if(val.charAt(i) === " "){
                if(word.charAt(j) === " ") ++j;
                continue;
            }

            if(word.charAt(j) === "," || word.charAt(j) === " "){
                ++j;
                --i;
                continue;
            }

            whitespace = false;

            if("āēīōū".includes(val.charAt(i).toLowerCase())){
                if(val.charAt(i).toLowerCase() != word.charAt(j).toLowerCase()){
                    flag = true;
                    break;
                }
            } else if(val.charAt(i).toLowerCase() != normalize(word.charAt(j)).toLowerCase()){
                flag = true;
                break;
            }

            ++j;
        }

        if(flag || whitespace) continue;

        for(const redirect in redirects[word]){
            var toword, key;
            if(typeof redirects[word][redirect] === "string"){
                toword = redirects[word][redirect];
            } else {
                toword = redirects[word][redirect]["word"];
                key = redirects[word][redirect]["key"];
            }

            if(suggested[toword]) continue;

            if(typeof toword === "undefined") console.log(redirects[word][redirect]);

            b = document.createElement("div");

            b.innerHTML = `<b>${word.substring(0, j)}</b>${word.substring(j) + " → " + toword + (key ? " (" + key + ")" : "")}`;
            b.innerHTML += `<input type="hidden" value="${toword}" class="word">`;
            if(key) b.innerHTML += `<input type="hidden" value="${key}" class="key">`;
            b.innerHTML += `<input type="hidden" value="${word}" class="redirect">`;

            b.addEventListener("click", function(e) {
                var word = this.querySelector(".word"),
                key = this.querySelector(".key"),
                redirect = this.querySelector(".redirect");

                searchBar.value = word.value;
                
                if(!searching){
                    searching = true;
                    redirected = redirect.value;
                    search(searchBar.value, key ? key.value : "");
                }
                closeAllLists();
            });
            if(j == word.length){
                a.prepend(b);
                if(++suggestions > MAXSUGGESTIONS)
                    a.removeChild(a.lastChild);
            } else if(suggestions < MAXSUGGESTIONS){
                a.appendChild(b);
                ++suggestions;
            }
            suggested[toword] = true;
        }
    }
})

document.addEventListener("click", function(e){
    if(e.target.isSameNode(searchBar)) return;
    closeAllLists();
});

Xbutton.addEventListener("click",function(e){
    closeAllLists();
    searchBar.value = "";
    searchBar.focus();
});