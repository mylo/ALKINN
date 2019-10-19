//Packages
const axios = require('axios');
const Table = require('cli-table3');
const keypress = require('keypress');
const chalk = require('chalk');


var cats =
    [{ isl: 'Rauðvín', en: 'red' },
    { isl: 'Hvítvín', en: 'white' },
    { isl: 'Bjór', en: 'beer' },
    { isl: 'Sterkt', en: 'strong' },
    { isl: 'Annað', en: 'other' },
    { isl: 'Eftirréttavín', en: 'desert' },
    { isl: 'Síder', en: 'cidersoda' },
    { isl: 'Umbúðir', en: 'wrapper' }]


//Command constructor
const construct = {
    command: '',
    string: '',
    sort: '',
    help: false,
    open: false
}

//Globals
let page = 1;
let products;
let openingHours;

//Initiates the CLI
function init() {
    readArgs();
    if (construct.help) {
        printHelp();
        return;
    }

    if (construct.open) {
        fetchOpeningHours()
            .then(data => printOpeningHours())
    } else if (construct.command) {
        keypress(process.stdin);
        process.stdin.on('keypress', function (ch, key) {
            if (key) {
                if (key.ctrl && key.name == 'c')
                    process.stdin.pause();

                if (key.name == 'right') {
                    (page < Math.ceil(products.length / 20)) && page++;
                    print();
                }

                if (key.name == 'left' && page > 1) {
                    page--;
                    print();
                }
            }
        });

        process.stdin.setRawMode(true);
        process.stdin.resume();
        processData();
    }

}

//Reads in cli arguments
function readArgs() {
    var args = process.argv.slice(2);
    for (i in args) {
        if (args[i] == 'get' || args[i] == 'find') {
            construct.command = args[i];
        } else if (args[i] == 'open') {
            construct.command = args[i];
            construct.open = true;
        } else if (args[i] == '-h' || args[i] == '--help') {
            construct.help = true;
        } else if (args[i][0] == '-') {
            construct.sort = args[i].slice(1);
        } else if (construct.command) {
            construct.string ? construct.string += ' ' + args[i] : construct.string += args[i];
        }
    }
    if (!construct.command || !args.length) { console.log('type: alkinn --help'); return; }
}

async function processData() {
    if (construct.command === 'get') {
        await fetchProducts(construct.string);
    } else if (construct.command === 'find') {
        await fetchProducts();
        find(construct.string);
    } else {
        return;
    }

    sortBy();
    print();

}

function find(string) {
    products = products.filter(p => {
        if (p.ProductName.toLowerCase().includes(string.toLowerCase()))
            return true;
        if (p.ProductCountryOfOrigin.toLowerCase().includes(string.toLowerCase()))
            return true;
        if (p.ProductCategory.name.toLowerCase().includes(string.toLowerCase()))
            return true;
    })
}

function sortBy(obj) {
    switch (construct.sort) {
        case ("name"):
            products = products.sort((a, b) => b.ProductName - a.ProductName);
            break;
        case ("volume"):
            products = products.sort((a, b) => b.ProductBottledVolume - a.ProductBottledVolume);
            break;
        case ("perc"):
            products = products.sort((a, b) => b.ProductAlchoholVolume - a.ProductAlchoholVolume);
            break;
        case ("price"):
            products = products.sort((a, b) => a.ProductPrice - b.ProductPrice);
            break;
        case ("country"):
            products = products.sort((a, b) => a.ProductCountryOfOrigin - b.ProductCountryOfOrigin);
            break;
        case ("category"):
            products = products.sort((a, b) => a.ProductCategory.name - b.ProductCategory.name);
            break;
        case ("drunk"):
            products = products.sort((a, b) => drunk(b) - drunk(a))
            break;
        default:
            break;
    }
}

const drunk = (p) => Number(p.ProductAlchoholVolume) * Number(p.ProductBottledVolume) / Number(p.ProductPrice);

function print() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
    logo();
    var table = new Table({
        head: ['Nafn', 'ml', '%', 'ISK', 'Upprunaland', 'Flokkur'],
        colWidths: [40, 8, 6, 9]
    });

    products.slice((page - 1) * 20, page * 20).map(product => {
        const { ProductName, ProductBottledVolume, ProductAlchoholVolume, ProductPrice, ProductCountryOfOrigin, ProductCategory } = product;
        const catLabel = cats.find(c => c.en === ProductCategory.name);
        table.push([ProductName, ProductBottledVolume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."), ProductAlchoholVolume, ProductPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."), ProductCountryOfOrigin, catLabel ? catLabel.isl : ProductCategory.name]);
    })

    console.log(table.toString());
    console.log(`Síða: ${chalk.bgRed.white.bold(page)}/${chalk.bgRed.white(Math.ceil(products.length / 20))}`)
}


function printHelp() {
    let usage = 'usage: alkinn <command> <string | type> [-sortby] [-h | --help]'
    usage += '\n'
    usage += `\n${chalk.green('command:')}       get <type>, find <string>, open (opening hours)`
    usage += `\n${chalk.green('string:')}        Search parameter using find`
    usage += `\n${chalk.green('types:')}         beer, red, white, strong, cider, desert`
    usage += `\n${chalk.green('sortby:')}        name, volume, perc, price, country, category or drunk(%*vol/price)`
    usage += '\n\n'
    usage += `\n${chalk.bold('-h | --help:')}  Show these instructions`

    console.log(usage);
}

const fetchProducts = (category = "", skip = 0, count = 5000, orderBy = "name+asc") => {
    return new Promise((resolve, reject) => {
        axios.get(`https://www.vinbudin.is/addons/origo/module/ajaxwebservices/search.asmx/DoSearch?category=${category}&skip=${skip}&count=${count}&orderBy=${orderBy}`, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => {
                products = JSON.parse(res.data.d).data;
                resolve();
            })
            .catch(err => {
                reject();
            })
    });
}


function fetchOpeningHours() {
    return new Promise((resolve, reject) => {
        axios.get('https://www.vinbudin.is/addons/origo/module/ajaxwebservices/search.asmx/GetAllShops', {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => {
                openingHours = JSON.parse(res.data.d);
                resolve();
            })
            .catch(err => {
                reject();
            })
    });
}


var changeKeys = function (str) {
    switch (str) {
        case '0':
            return 'foodcategories';
        case '1':
            return 'name';
        case '2':
            return 'id';
        case '3':
            return 'volume';
        case '4':
            return 'perc';
        case '5':
            return 'price';
        default:
            return str;
    }
};



/*
var store = {
    'title': title,
    'address': address,
    'openHour': openHour,
    'closeHour': closeHour
};
*/

/*
    20        10    10          20
    Title   Opens   Closes      Address
*/

function printOpeningHours() {
    iceland();

    var table = new Table({
        head: ['Verslun', 'Staður', 'Opnar', 'Lokar'],
        colWidths: [40, 40, 10, 10]
    });

    openingHours.slice((page - 1) * 20, page * 20).map(location => {
        const { Name, Address, today } = location;
        const h = new Date().getHours();
        let open, close;

        if (today.open === "Lokað") {
            open = null;
            close = null;
        } else {
            open = Number(today.open.split(' - ')[0]);
            close = Number(today.open.split(' - ')[1]);
        }

        (h >= open && h < close) ?
            table.push([Name, Address, open, close])
            :
            table.push([chalk.gray(Name), chalk.gray(Address), chalk.gray(open), chalk.gray(close)])
    })

    console.log(table.toString());
}

// Icelandic map w. opening icons
function iceland() {
    const openings = {};
    openingHours.map(location => {
        const h = new Date().getHours();
        let title = location['Name'].toLowerCase();
        title = title.replace(/[á]/g, "a");
        title = title.replace(/[æ]/g, "ae");
        title = title.replace(/[í]/g, "i");
        title = title.replace(/[ú]/g, "u");
        title = title.replace(/[óö]/g, "o");
        title = title.replace(/[þ]/g, "t");
        title = title.replace(/[ð]/g, "d");

        const open = Number(location.today.open.split(' - ')[0]);
        const close = Number(location.today.open.split(' - ')[1]);

        openings['' + title.split(' ')[0]] = (h >= open && h < close) ? chalk.green('@') : chalk.red('@');
    })

    console.log(`
                                                                    ;#'
                +#@:@@|                                          |@@@@@|
               .:@@@@@@                                           '${openings.kopasker}@@@@@   @@@|
                .'|;@@@;                                          |@@@@#    ${openings.torshofn}#
             ,.  #@@#@@@@'                                         @@@@@@+|+@@@
            #@@@| @@@@@@@@@                    |,;           @@| '@@@@@@@@@@@@|
          |@,@@@${openings.isafjordur},  +@@@@@@          |+.       @${openings.siglufjordur}@@ .@@+   ,${openings.husavik}@@@@@@@@@@@@@@@@| #
           @@@@@@@#@ @@@@@@@#.      ,@@@    +@@@@@@' @@@@@  @@@@@@@@@@@@@@@@@@@@@+
          @''@@@@@@@@;@@@@@@@'      .@@@'  |@@@@@@@';'@@@@@@@@@@@@@@@@@@@@@@@@@@@+
          +@@@@@@@@@@@@@@@@@@@,      @@@@;  @@@@@@@@@'@@@@@@@@@@@@@@@@@@@@@@@@@@#
        @@|:@##@@@@@@@@@@@@@@${openings.holmavik}       +@@@@+ ,@@@@@@@@${openings.dalvik}|@@@@@@@@@@@@@@@@@@@@@@@${openings.vopnafjordur},.#@
        :${openings.patreksfjordur}@@:@@@@@@@@@@@@@@@@+       .${openings.blonduos}@@@${openings.saudarkrokur}''@@@@@@@@@+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;
     .@#'@@@#@@@@@@@@@@@@@@..     @| :@@@@@@@@@@@@@@@@@${openings.akureyri}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
    :@@@@@@@@@@@@+@++@@@@@@@@'  |@@.;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@#;@   + ',@@@@@@@@  #${openings.hvammstangi}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
         :,          .@||@@@@@..@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#
                       ;@@@@@@'#+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'.
                     #@@@@@@@@+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@,
                   ,@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;;
                  |#'@@@@.@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@${openings.egilsstadir}@@@${openings.seydisfjordur}@@@#
                 :: ||   '${openings.budardalur}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+.${openings.neskaupstadur}@
            .|@#@@${openings.budardalur}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@${openings.reydarfjordur}@@@@@@.
       +@@'${openings.olafsvik}@@@${openings.stykkisholmur}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@${openings.faskrudsfjordur}@@@
       ;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
        @@+    |,'@;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
                    #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
                   |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@${openings.djupivogur}#
                    +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
                     @${openings.borgarnes};@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
                       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
                       ${openings.akranes}'+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
                      ,:;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|;,${openings.hofn}|
                        #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;
                       ${openings.skutuvogur}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
                 @|   .${openings.dalvegur}${openings.skeifan}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+
                :${openings.reykjanesbaer}#;@@${openings.alfrun}@@@@@@@@@${openings.hveragerdi}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@,
                .@@@@@@@@@@@@@@@@@@${openings.selfoss}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
                ,@@${openings.grindavik}@@@@#@@@'+${openings.torlakshofn}@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
                               :@@@@@@@@@@@@@@@@@@@@@@@@@@${openings.kirkjubaejarklaustur}@@@@@#'|
                                 :@@@@${openings.hella}@@@@@@@@@@@@@@@@@@@@:
                                   @@@@@${openings.hvolsvollur}@@@@@@@@@@@@@@@@@|
                                    ;@@@@@@@@@@@@@@@@@@@@;
                                      |.,;@@@@@@@@@@@@@@'
                                            :@@${openings.vik}@@@@@;|
                                        ${openings.vestmannaeyjar}         ,|
    `);
}


// Ascii logo
const logo = () => {
    console.log(`${chalk.red('               ________  ')}${chalk.gray('___       ___  __    ___  ________   ________        ')}`);
    console.log(`${chalk.red('               |\\   __  \\ ')}${chalk.gray('|\\  \\     |\\  \\|\\  \\ |\\  \\|\\   ___  \\|\\   ___  \\     ')}`);
    console.log(`${chalk.red('               \\ \\  \\|\\  \\ ')}${chalk.gray(' \\  \\    \\ \\  \\/  /|\\ \\  \\ \\  \\\\ \\  \\ \\  \\\\ \\  \\    ')}`);
    console.log(`${chalk.red('                \\ \\   __  \\ ')}${chalk.gray(' \\  \\    \\ \\   ___  \\ \\  \\ \\  \\\\ \\  \\ \\  \\\\ \\  \\   ')}`);
    console.log(`${chalk.red('                 \\ \\  \\ \\  \\ ')}${chalk.gray(' \\  \\____\\ \\  \\\\ \\  \\ \\  \\ \\  \\\\ \\  \\ \\  \\\\ \\  \\  ')}`);
    console.log(`${chalk.red('                  \\ \\__\\ \\__\\ ')}${chalk.gray(' \\_______\\ \\__\\\\ \\__\\ \\__\\ \\__\\\\ \\__\\ \\__\\\\ \\__\\ ')}`);
    console.log(`${chalk.red('                   \\|__|\\|__|')}${chalk.gray('\\|_______|\\|__| \\|__|\\|__|\\|__| \\|__|\\|__| \\|__| ')}`);
    console.log('');
}

init();