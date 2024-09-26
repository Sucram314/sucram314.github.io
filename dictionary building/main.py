import sys,os
import traceback
import json
from collections import OrderedDict
import unicodedata

__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

try:
    def strip_accents(s):
        return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

    f = open(f"{__location__}\\data.txt",encoding="utf-8")

    s = f.read().split("\n")

    commented = False
    starred = False
    message = ""
    globalnotes = []
    globalexceptions = {}

    rmn = ["irreg", "I", "II", "III", "IV", "V", "VI","indeclinable"]
    dictionary = {}
    i = 0

    for line in s:
        i += 1
        if line == "": continue

        if commented:
            if line == "##":
                commented = False
            continue
        else:
            if line == "##":
                commented = True
                continue

        flag = starred

        if starred:
            if line == "**": 
                starred = False
                continue
        else:
            if line[0] == line[1] == "*":
                starred = True
                message = line[2:]
                continue

        if line[-1] == "#": continue
        if not starred and "*" in line:
            line, message = line.split("*")
            flag = True

        if line[0] == line[1] == "%":
            if line == "%%": globalnotes = []
            else: globalnotes = [line[2:]]
            continue

        if line[0] == line[1] == "^":
            if line == "^^": globalexceptions = {}
            else: 
                globalexceptions = {}
                for a in line[2:].split(","):
                    a = a.split(":")
                    if len(a) == 2:
                        globalexceptions[a[0]] = a[1]
                    else:
                        globalexceptions[a[0]] = True
            continue

        stuff = line.replace(";", "&", 1).split("&")
        word = stuff[0]
        stuff = stuff[1].split("/")
        defs = []
        print(line)

        for x in stuff:
            exceptions = globalexceptions.copy()
            notes = globalnotes[:]
            if "^" in x:
                x, e = x.split("^")
                for a in e.split(","):
                    a = a.split(":")
                    if len(a) == 2:
                        exceptions[a[0]] = a[1]
                    else:
                        exceptions[a[0]] = True

            if "%" in x:
                x, notes = x.split("%")
                notes = notes.split("|")

            y = x.split(";")

            if exceptions.get("i-stem"): notes.append("i-stem")
            if exceptions.get("abl-i-stem"): notes.append("ablative i-stem")
            if exceptions.get("sfg"): notes.append("special funny genitive")
            if exceptions.get("sfd"): notes.append("special funny dative")
            if exceptions.get("root"): notes.append("irregular root: " + exceptions["root"] + "-")
            if exceptions.get("future-infinitive"): notes.append("future infinitive: " + exceptions["future-infinitive"] + ("-" if y[0] == "dv" else ""))
            if exceptions.get("irregular-imperative"): notes.append("irregular imperative")
            if exceptions.get("plural"): notes.append("must be in the plural form")
            
            if y[0] == "n":
                if int(y[1]) == 3:
                    defs.append({
                        "type": "noun",
                        "declension": "III",
                        "root": y[2],
                        "gender": y[3],
                        "meaning": y[4]
                    })
                else:
                    defs.append({
                        "type": "noun",
                        "declension": (int(y[1]) if int(y[1]) >= len(rmn) else rmn[int(y[1])]),
                        "gender": y[2],
                        "meaning": y[3]
                    })
            elif y[0] == "v":
                if int(y[1]) == 0:
                    defs.append({
                        "type":"verb",
                        "declension": rmn[int(y[1])],
                        "base":y[2],
                        "infinitive":y[3],
                        "perfect-root":y[4],
                        "perfect-passive-participle":y[5],
                        "meaning": y[6]
                    })
                else :
                    defs.append({
                        "type":"verb",
                        "declension": rmn[int(y[1])] + ((" reg" if word[-2] != "i" else " spec") if int(y[1]) == 3 else ""),
                        "infinitive":y[2],
                        "perfect-root":y[3],
                        "perfect-passive-participle":y[4],
                        "meaning": y[5]
                    })
            elif y[0] == "dv":
                defs.append({
                    "type":"deponent verb",
                    "declension": rmn[int(y[1])] + ((" reg" if word[-3] != "i" else " spec") if int(y[1]) == 3 else "") + " dep",
                    "infinitive":y[2],
                    "perfect-root":y[3],
                    "meaning": y[4]
                })
            elif y[0] == "adj":
                defs.append({
                    "type": "adjective",
                    "declension":"III" if int(y[1]) == 3 else "I~II",
                    "meaning":y[2]
                })
            else:
                if y[0] == "adv": y[0] = "adverb"
                elif y[0] == "conj": y[0] = "conjunction"
                elif y[0] == "prep": y[0] = "preposition"
                elif y[0] == "int": y[0] = "interrogative"
                elif y[0] == "num": y[0] = "number"
                elif y[0] == "spec": y[0] = "special"
                elif y[0] == "pron": y[0] = "pronoun"

                defs.append({"type": y[0], "meaning": y[1]})

            if exceptions:
                defs[-1]["exceptions"] = exceptions

            if notes:
                defs[-1]["notes"] = notes

            if flag: 
                defs[-1]["flag"] = message
        
        if len(defs) == 1: dictionary[word] = defs[0]
        else:
            container = {}
            cnts = {}
            for definition in defs:
                if definition["type"] in cnts:
                    cnts[definition["type"]] += 1
                    container[definition["type"] + str(cnts[definition["type"]])] = definition
                else:
                    cnts[definition["type"]] = 1
                    container[definition["type"]] = definition

            dictionary[word] = {"multiple-definitions":True,"content":container}

    g = open(f"{__location__}\\result.txt", "w", encoding="utf-8")
    g.truncate(0)

    json.dump(
        OrderedDict(sorted(dictionary.items(), key=lambda x: strip_accents(x[0]).lower())),
        g,
        ensure_ascii=False,
        indent=4
    )
    
    g.close()
except Exception as e:
    print(traceback.format_exc())
    input()
    sys.exit()

input("success!")
