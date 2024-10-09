const NROWS = 10, NCOLS = 18;
const display = document.getElementById("display");
const details = document.getElementById("details");
const table = document.getElementById("periodic");
var elements;

var classNames = {
    "alkali-metal": "alkali metal", 
    "alkaline-earth-metal": "alkaline earth metal",
    "transition-metal": "transition metal",
    "post-transition-metal": "post-transition metal",
    "metalloid": "metalloid",
    "reactive-nonmetal": "reactive nonmetal",
    "halogen": "halogen",
    "noble-gas": "noble gas",
    "lanthanide": "lanthanide",
    "actinide": "actinide",
    "unknown-properties": "unknown"
}

async function get_data(){
    return fetch('../resources/data/chemistry/elements.json')
        .then(res => res.json())
        .then(data => {elements = data;});
}

async function build(){
    await get_data();

    table.innerHTML = `<tr>${`<td></td>`.repeat(NCOLS)}</tr>`.repeat(NROWS);

    for(element in elements){
        var info = elements[element];
        var coord = info["coord"];

        var container = document.createElement("div");
        container.classList.add(info["class"])

        var symbol = document.createElement("div");
        symbol.innerText = element;
        container.appendChild(symbol);

        var number = document.createElement("span");
        number.innerText = info["number"]
        container.appendChild(number);

        table.rows[coord[0]-1].cells[coord[1]-1].appendChild(container);

        container.addEventListener("click",function(e){
            var element = this.children[0].innerText;
            var info = elements[element]

            display.innerHTML = ``;
            var copy = this.cloneNode(true);

            var mass = document.createElement("aside");
            mass.innerText = parseFloat(info["mass"].toPrecision(5));
            copy.appendChild(mass);

            var name = document.createElement("blockquote");
            name.innerText = info["name"]
            copy.appendChild(name);

            display.appendChild(copy);
            
            details.innerHTML = `${classNames[info["class"]]}<br>`;
            details.innerHTML += `group  ${info["group"] == 0 ? "/" : info["group"]}<br>`;
            details.innerHTML += `period ${info["period"]}<br>`
            details.innerHTML += `q: ${info["charges"].length == 0 ? "/" : info["charges"].map((x) => x > 0 ? x+"+" : x < 0 ? -x+"-" : "0").join(",")}<br>`;
            details.innerHTML += info["e-config"].replaceAll("{","<sup>").replaceAll("}","</sup>");
        });
    }
}



build();