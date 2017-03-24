# Alkinn-CLI
A handy CLI for the thirsty!

## Install

```bash
npm install alkinn -g
```

## Usage
```
usage: alkinn <command> <string | type> [-sortby] [-h | --help]

command:      get <type>, find <string>, open (opening hours)
string:       Search parameter using find
types:        beer, red, white, strong, cider, desert
-sortby:      name, volume, perc, price, country, category or drunk

-h | --help:  Show these instructions
```
## Example

```bash
  alkinn find tuborg -drunk
```

```bash
  alkinn get beer -name
```

## License

[MIT](http://vjpr.mit-license.org)