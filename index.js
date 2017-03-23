var chalk = require('chalk');

// Load the full build.
var _ = require('lodash');
var rename = require('rename-keys');
var tabletojson = require('tabletojson');
var Promise = require('promise');
var url = 'http://www.vinbudin.is/heim/vorur/tabid-2311.aspx';

var categories = ['Rauðvín', 'Hvítvín', 'Bjór', 'Sterkt', 'Annað', 'Eftirréttavín o.fl.', 'Síder og gosblöndur', 'Umbúðir og aðrar söluvörur'];
var res;

init();

function init(){
    var args = process.argv.slice(2);
    if(args[0] === 'h' || args[0] === 'help'){
        printHelp();
        return;
    }
    fetch()
        .then(result => {
            res = result[0];
            main();
        });
}

function main(){
    var args = process.argv.slice(2);
    if(args[0] === 'get'){
        if(args[1] === 'red'){
            get('Rauðvín')
        } else if(args[1] === 'white'){
            get('Hvítvín');
        } else if(args[1] === 'beer'){
            get('Bjór');
        } else if(args[1] === 'strong'){
            get('Sterkt');
        } else if(args[1] === 'Ciders'){
            get('Síder og gosblöndur');
        } else if(args[1] === 'Desert'){
            get('Eftirréttavín o.fl.');
        }
    }
}

/*Print*/

/*
    40          9           15    15        25              24
    Name        VOL         %     ISK       Country         Cat

*/
function print(obj){
    console.log(`
                                                                 ┌───────────────┐
    ┌────────────────────────────────────────┬────────────┬──────┤    ALKINN     ├──────┬────────────────────────┬────────────────────────┐
    │                   Name                 │   Vol      |   %  └───────┬───────┘  ISK │         Country        │        Category        │
    ├────────────────────────────────────────┼────────────┼──────────────┼──────────────┼────────────────────────┼────────────────────────┤`);
    for(i in obj){
        var str = '';
        str += '    ';
        for(j in obj[i]){
            if(validInfo(j)){
                var cellSize;
                switch (j){
                    case 'name':     cellSize = 40; break;
                    case 'volume':   cellSize = 12; break;
                    case 'perc':     cellSize = 14; break;
                    case 'price':    cellSize = 14; break;
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
    console.log('    └────────────────────────────────────────┴────────────┴──────────────┴──────────────┴────────────────────────┴────────────────────────┘')
}

function validInfo(j){
    return (j === 'name') || (j === 'country') || (j === 'volume') || (j === 'perc') || (j === 'price') || (j === 'category');
}


function printHelp(){
    let usage = 'usage: alkinn <command> <string> [-h | --help]'
    usage += '\n'
    usage += `\n${chalk.bold('command:')}      A command,\tsee ${chalk.bold('alkinn commands')}`
    usage += `\n${chalk.bold('string:')}       A string, \tsee ${chalk.bold('alkinn commands')}`
    usage += `\n${chalk.bold('-h | --help:')}  Show these instructions`
    usage += '\n\n'
    usage += chalk.italic('Other available commands')
    usage += `\n${chalk.bold('alkinn commands')}    Display list of all commands`

    console.log(usage);
}



/*Returns beers*/
function get(type){
    print(_.filter(res, {category: type}));
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
    return _.includes(categories, str);
}
