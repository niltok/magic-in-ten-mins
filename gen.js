const marked = require('marked')
const fs = require('fs')
const hljs = require('highlight.js')

if (fs.existsSync("html")) fs.rmSync("html", {
    recursive: true
})

fs.mkdirSync("html")

const $$ = (label, attr = '') => s => '<' + label + ' ' + attr + '>\n' + s + '</' + label + '>\n'

const charset = '<meta charset="utf-8"/>\n'
const viewpoint = '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n'
const title = $$('title')('十分钟魔法练习')

const hljscss = '<link href="https://cdn.bootcdn.net/ajax/libs/highlight.js/10.3.2/styles/a11y-light.min.css" rel="stylesheet">'
const materialize = '<link href="https://cdn.bootcdn.net/ajax/libs/materialize/1.0.0-rc.2/css/materialize.min.css" rel="stylesheet">'

const style = $$('style')(fs.readFileSync('style.css'))

const head = $$('head')(charset + viewpoint + title + style)

const star = '<a href="https://github.com/niltok/magic-in-ten-mins">⭐Star me on GitHub⭐</a>'
const home = '<a href="https://magic.huohuo.moe">🏠Homepage🏠</a>'

const gen = s => {
    return '<!DOCTYPE html>' + $$('html', 'lang="zh-CN" prefix="og: https://ogp.me/ns#"')
    (head + $$('body')($$('p')(home + ' | ' + star) +
        marked(s, {
            highlight: (code, lang) => {
                if (typeof lang == 'undefined' || lang == '')
                    return hljs.highlightAuto(code).value
                else if (lang == 'nohighlight')
                    return code
                else return hljs.highlight(code, { language: lang }).value
            }
        })))
}

fs.readdirSync("doc").forEach(f => {
    if (f.endsWith(".md")) {
        const content = fs.readFileSync("doc/" + f).toString()
        fs.writeFileSync("html/" + f.slice(0, f.length - 3) + ".html", gen(content))
    }
})

const index = fs.readFileSync('readme.md').toString()
fs.writeFileSync('index.html', gen(index))