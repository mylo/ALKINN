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
            {isl: 'Eftirréttavín o.fl.',          en: 'deser'},
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
    iceland();
    readArgs();
    if(construct.help){
        printHelp();
        return;
    }
    fetchData().then(result => {
        processData();
    });
}

function fetchData(){
    return new Promise(function(resolve, reject){
        fetch().then(result => {
            res = result[0];
        });
        fetchOpeningHours().then(result => {
            ope = result;
        });
        resolve(true);
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
            console.log(construct.command);
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
    console.log("PROCSSING");
    if(construct.command === 'get'){
        data = get(_.find(cats, {'en': construct.string}).isl)
    } else if(construct.command === 'find'){
        data = find(construct.string);
    } else if(construct.command === 'open'){
        console.log("OPENING HOURS");
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
    console.log(`                                                ┌───────────────┐
    ┌────────────────────────────────────────┬────────────┬──────┤    ALKINN     ├──────┬────────────────────────┬────────────────────────┐
    │                   Name                 │   Vol      |   %  └───────┬───────┘  ISK │         Country        │        Category        │
    ├────────────────────────────────────────┼────────────┼──────────────┼──────────────┼────────────────────────┼────────────────────────┤`);
    for(i in obj){
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

/*fetches alka info*/
function fetch(){
    return new Promise(function(resolve, reject){
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
                resolve(tablesAsJson);
            } else {
                reject(tablesAsJson)
            }
        });
    })
}

function fetchOpeningHours(){
    return new Promise(function(resolve, reject){
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
                    resolve(openingHoursArr);
                } else {
                    reject(openingHoursArr);
                }
            }
        });
    })
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
