//Packages
var _               = require('lodash');
var rename          = require('rename-keys');
var tabletojson     = require('tabletojson');
var Promise         = require('promise');
var chalk           = require('chalk');
var request = require('request');
var cheerio = require('cheerio');

// Url to fetch vinbudin
var url = 'http://www.vinbudin.is/heim/vorur/tabid-2311.aspx';
var openingHours = 'http://www.vinbudin.is/heim/opnunartimar.aspx';
var cats = [{isl: 'Rauðvín',                      en: 'red'},
            {isl: 'Hvítvín',                      en: 'white'},
            {isl: 'Bjór',                         en: 'beer'},
            {isl: 'Sterkt',                       en: 'strong'},
            {isl: 'Annað',                        en: 'other'},
            {isl: 'Eftirréttavín o.fl.',          en: 'desert'},
            {isl: 'Síder og gosblöndur',          en: 'cider'},
            {isl: 'Umbúðir og aðrar söluvörur',   en: ''}]


//Command constructor
var construct = {
    command: '',
    string: '',
    sort: '',
    help: false
}

//Temps
var res;
var ope;

init();
//Initiates the CLI
function init(){
    readArgs();
    if(construct.help){
        printHelp();
        return;
    }

    /*
    fetchProducts().then((data) => {
        console.log(ope.length)
        processData();
    })
    */
    /*Fetch all datas*/

    Promise.all([fetchProducts(), fetchOpeningHours()]).then((data) => {
        processData();
    });
}

//Reads in cli arguments
function readArgs(){
    var args = process.argv.slice(2);
    if(!args.length){ console.log('type: alkinn --help') };
    for(i in args){
        if(args[i] == 'get' || args[i] == 'find'){
            construct.command = args[i];
        } else if(args[i] == 'open'){
            construct.command = args[i];
        } else if(args[i] == '-h' || args[i] == '--help'){
            construct.help = true;
        } else if(args[i][0] == '-'){
            construct.sort = args[i].slice(1);
        } else if(construct.command) {
            construct.string ? construct.string += ' ' + args[i]: construct.string += args[i];
        }
    }
}

function processData(){
    var data = [];
    if(construct.command === 'get'){
        data = get(_.find(cats, {'en': construct.string}).isl)
    } else if(construct.command === 'find'){
        data = find(construct.string);
    } else if(construct.command === 'open'){
        iceland();
        printOpeningHours();
        return;
    }
    if(construct.sort){
        data = sortBy(data);
    }
    print(data);
}

function find(string){
    var contains = [];
    for(i in res){
        if(res[i]['name'].toLowerCase().includes(string.toLowerCase())){
            contains.push(res[i]);
        }
    }
    return contains;
}

function sortBy(obj){
    if(construct.sort == 'drunk'){
        return _.sortBy(obj, function(o){
            return (o['volume'] * o['perc'] / 100) / o['price'];
        })
    } else {
        return _.sortBy(obj, construct.sort);
    }
}
/*Print*/

/*
    40          9           15    15        25              24
    Name        VOL         %     ISK       Country         Cat

*/
function print(obj){
    console.log(`                                                                 ┌───────────────┐
    ┌────────────────────────────────────────┬────────────┬──────┤    ALKINN     ├──────┬────────────────────────┬────────────────────────┐
    │                   Name                 │   Vol      |   %  └───────┬───────┘  ISK │         Country        │        Category        │
    ├────────────────────────────────────────┼────────────┼──────────────┼──────────────┼────────────────────────┼────────────────────────┤`);
    for(i in obj){true
        if(obj[i].category != 'Annað' &&  obj[i].category != 'Umbúðir og aðrar söluvörur'){
            var str = '';
            str += '    ';
            for(j in obj[i]){
                if(validInfo(j)){
                    var cellSize;
                    switch (j){
                        case 'name':     cellSize = 40; break;
                        case 'volume':   cellSize = 12; obj[i][j] += ' ml'; break;
                        case 'perc':     cellSize = 14; obj[i][j] += ' %'; break;
                        case 'price':    cellSize = 14; obj[i][j] += ' kr.'; break;
                        case 'country':  cellSize = 24; break;
                        case 'category': cellSize = 24; break;
                    }
                    if(obj[i][j].length > 30){
                        obj[i][j] = obj[i][j].substr(0, 30) + '...';
                    }
                    var offset = _.repeat(' ', ((cellSize - obj[i][j].length)/2));
                    if(obj[i][j].length % 2 == 0){
                        str += '|' + offset + obj[i][j] + offset;
                    } else {
                        str += '|' + offset + obj[i][j] + offset + ' ';
                    }
                }
            }
            str += '|';
            console.log(str);
            str = '';
        }
    }
    console.log('    └────────────────────────────────────────┴────────────┴──────────────┴──────────────┴────────────────────────┴────────────────────────┘');
    console.log('');
}

function validInfo(j){
    return (j === 'name') || (j === 'country') || (j === 'volume') || (j === 'perc') || (j === 'price') || (j === 'category');
}

function printHelp(){
    let usage = 'usage: alkinn <command> <string> [-sortby] [-h | --help]'
    usage += '\n'
    usage += `\n${chalk.bold('command:')}      GET <type>, FIND <searchstring>`
    usage += `\n${chalk.bold('string:')}       type or searchstring`
    usage += `\n${chalk.bold('-sortby:')}      name, volume, perc, price, country, category or drunk`
    usage += `\n${chalk.bold('-h | --help:')}  Show these instructions`
    usage += '\n\n'
    usage += chalk.italic('Other available commands')
    usage += `\n${chalk.bold('alkinn commands')}    Display list of all commands`

    console.log(usage);
}

/*Returns beers*/
function get(type){
    if(type){
        return _.filter(res, {category: type});
    } else {
        return res;
    }
}

function fetchProducts(){
    return new Promise((resolve, reject) => {
        tabletojson.convertUrl(url)
        .then(function(tablesAsJson) {
            for(i in tablesAsJson){
                for(j in tablesAsJson[i]){
                    //Hvert object
                    var obj = tablesAsJson[i][j];
                    var currCountry;
                    var currCategory;
                    if(Object.keys(obj).length === 1){
                        if(isCategory(obj['0'])){
                            currCategory = obj['0'];
                        } else {
                            currCountry = obj['0'];
                        }
                        delete tablesAsJson[i][j];
                    } else {
                        tablesAsJson[i][j] = rename(obj, changeKeys);
                        tablesAsJson[i][j].country = currCountry;
                        tablesAsJson[i][j].category = currCategory;

                        tablesAsJson[i][j].price = Number(tablesAsJson[i][j].price.slice(0, -4).replace('.', ''));
                        tablesAsJson[i][j].perc = Number(tablesAsJson[i][j].perc.slice(0, -1));
                        tablesAsJson[i][j].volume = Number(tablesAsJson[i][j].volume.slice(0, -2));
                    }
                }
            }

            if(tablesAsJson){
                res = tablesAsJson[0];
                resolve(true);
            } else {
                reject(false);
            }
        });
    });
}


function fetchOpeningHours(){
    return new Promise((resolve, reject) => {
        var openingHoursArr = [];
        request(openingHours, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                $('.info').each(function(i, element){
                    //console.log($(element).text());
                    var title = $(element).find('.title').text();
                    var address = $(element).find('.address').text();
                    var openingHours = $(element).find('.openinghours').text().trim();
                    var openHour = openingHours.substring(openingHours.lastIndexOf('-') - 3, openingHours.lastIndexOf('-'));
                    var closeHour = openingHours.substring(openingHours.lastIndexOf('-') + 2, openingHours.lastIndexOf('-') + 4);
                    var store = {
                        'title': title,
                        'address': address,
                        'openHour': openHour,
                        'closeHour': closeHour
                    };
                    openingHoursArr.push(store);
                });

                if(openingHoursArr){
                    ope = openingHoursArr;
                    resolve(true);
                } else {
                    reject(false);
                }
            }
        });
    });
}


var changeKeys = function(str){
    switch(str) {
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

var isCategory = function(str){
    return _.includes(_.map(cats, 'isl'), str);
}


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

function printOpeningHours(){
    console.log(`                                                   ┌───────────────┐
    ┌──────────────────────────┬───────────────────┤    ALKINN     ├──────────┬──────────┬──────────┐
    │          Title           │   Address         └───────────────┘          │   Open   │  Close   │
    ├──────────────────────────┼──────────────────────────────────────────────┼──────────┼──────────┤`);
    for(i in ope){
        var obj = ope[i];
        var str = '';
        var red = false;
        str += '    ';
        for(var j in obj){
            if(obj[i]['closeHour'] < Date.now().getHours()){
                red = true;
            }
            var cellSize;
            switch (j) {
                case 'title':     cellSize = 26; break;
                case 'address':   cellSize = 46; break;
                case 'openHour':  cellSize = 10; break;
                case 'closeHour': cellSize = 10; break;
            }
            var offset = _.repeat(' ', ((cellSize - obj[j].length)/2));
            if(obj[j].length % 2 == 0){
                str += '|' + offset + obj[j] + offset;
            } else {
                str += '|' + offset + obj[j] + offset + ' ';
            }
        }
        str += '|';
        console.log(chalk.styles.red.open + str + chalk.styles.red.close);
        str = '';
    }
    console.log('    └──────────────────────────┴──────────────────────────────────────────────┴──────────┴──────────┘');
    console.log('');
}


function iceland(){
    console.log(`
                                                                    ;#'
                +#@:@@\                                          \@@@@@|
               .:@@@@@@                                           '@@@@@@     @@@|
                .'\;@@@;                                          \@@@@@#    @#
             ,.  #@@#@@@@'                                         @@@@@@+\+@@@
            #@@@\ @@@@@@@@@                    \,;           @@\ '@@@@@@@@@@@@|
          \@,@@@@,  +@@@@@@          \+.       @@@@ .@@@+   ,@@@@@@@@@@@@@@@@@\ #
           @@@@@@@#@ @@@@@@@#.      ,@@@    +@@@@@@' @@@@@  @@@@@@@@@@@@@@@@@@@@@+
          @''@@@@@@@@;@@@@@@@'      .@@@'  \@@@@@@@';'@@@@@@@@@@@@@@@@@@@@@@@@@@@+
          +@@@@@@@@@@@@@@@@@@@,      @@@@;  @@@@@@@@@'@@@@@@@@@@@@@@@@@@@@@@@@@@#
        @@\:@##@@@@@@@@@@@@@@@       +@@@@+ ,@@@@@@@@@\@@@@@@@@@@@@@@@@@@@@@@@@@,.#@
        :@@@:@@@@@@@@@@@@@@@@+       .@@@@#''@@@@@@@@@+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;
     .@#'@@@#@@@@@@@@@@@@@@..     @\ :@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
    :@@@@@@@@@@@@+@++@@@@@@@@'  \@@.;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@#;@   + ',@@@@@@@@  #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
         :,          .@||@@@@@..@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#
                       ;@@@@@@'#+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'.
                     #@@@@@@@@+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@,
                   ,@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;;
                  \#'@@@@.@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#
                 :: ||   '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+.@@
            .\@#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
       +@@'@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
       ;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
        @@+    \,'@;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
                    #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
                   \@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:#
                    +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
                     @@;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
                       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
                       @@'+#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
                      ,:;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\;,@|
                        #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;
                      \@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
                 @\   .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+
                :@#;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@,
                .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.
                ,@@@@@@@#@@@'+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
                               :@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#'|
                                 :@@@@@@@@@@@@@@@@@@@@@@@@@:
                                   @@@@@@@@@@@@@@@@@@@@@@@|
                                    ;@@@@@@@@@@@@@@@@@@@@;
                                      \.,;@@@@@@@@@@@@@@'
                                            :@@@@@@@@;|
                                                 ,|
    `);
}
