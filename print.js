module.exports = function(){
    this.print = function(obj){
        console.log('going to print');
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
}