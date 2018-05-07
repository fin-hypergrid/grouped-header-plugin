# assumptions: on master branch with working tree clean and index.html up to date

echo "(function(require,module,exports,Hypergrid){" > b
cat index.js >> b
echo "})(fin.Hypergrid.require,fin.$={exports:{}},fin.$.exports,fin.Hypergrid);" >> b
echo "fin.Hypergrid.modules['fin-hypergrid-grouped-header-plugin']=fin.$.exports;" >> b
echo "delete fin.$;" >> b

mv b fin-hypergrid-grouped-header-plugin.js

if ! [ -a /usr/local/bin/uglifyjs ]; then
npm install -g uglify-js
fi

uglifyjs fin-hypergrid-grouped-header-plugin.js -cmo fin-hypergrid-grouped-header-plugin.min.js
ls -lahL fin-hypergrid-grouped-header-plugin.*

VER=$(cat package.json | sed -En 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p')
mkdir $VER
mkdir $VER/build
mv fin-*.js $VER/build
sed 's/M\.m\.p/'$VER'/g' index.html > $VER/index.html

# Do a fetch + recreate local branch rather than a pull to accommodate first time when there is no local gh-pages branch yet
git fetch origin gh-pages #2> /dev/null
git checkout origin/gh-pages #2> /dev/null
git branch -D gh-pages #2> /dev/null
git checkout -b gh-pages #2> /dev/null

rm .gitignore .npmignore README.md LICENSE *.js *.sh *.json
mv $VER/index.html .
git add $VER index.html
git status
git commit -am $VER

git push origin -f gh-pages

git checkout master

open https://fin-hypergrid.github.io/grouped-header-plugin
