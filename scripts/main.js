const moduleID = 'better-dice-tooltips';

const logg = x => console.log(x);

function createTerm(text) {
    const add = document.createElement('li');
    add.classList.add('roll', 'term');
    add.innerText = text;
    return add;
}

function parseTooltip(tooltip, options) {
    let terms = [];
    tooltip.querySelectorAll('.dice').forEach(head => {
        const formula = head.querySelector('.part-formula')?.innerText;
        if(formula === null) return;
        const regex = /(\d+)d(\d+)(kh|l)?/
        const [ _, diceCount, diceSize, takeOne ] = regex.exec(formula);
        let dice = [];
        head.querySelectorAll('.roll.die').forEach(d => {
            const r = d.cloneNode(true);
            r.title = `d${diceSize}`;
            if (options.isMultiattack) {
                r.innerText = r.title;
                r.classList.remove('max', 'min');
            }
            dice.push(r);
        });
        if(!takeOne) {
            dice = dice.flatMap(d => [d, createTerm('+')]);
            dice.pop();
        }
        terms.push({
            formula,
            dice,
        });
    });
    return terms;
}

function dfs_text_replace(div, data, index) {
    if(index >= data.length) return;
    let newChildren = [];
    for(let c of div.childNodes) {
        if(c instanceof Text) {
            if(index < data.length) {
                let terms = c.textContent.split(/(\d+d\d+(?:kh|l)?)/g);
                for(let i = 0; i < terms.length; i += 2) {
                    if(terms[i].length > 0) {
                        newChildren.push(createTerm(terms[i]));
                    }
                    if(i + 1 >= terms.length) continue;
                    if(terms[i+1] !== data[index].formula) {
                        logg('Better Dice Tooltips | inconsistent parse', c.textContent, data, i/2, index)
                    }
                    newChildren.push(data[index++].dice);
                }
            } else {
                newChildren.push(createTerm(c.textContent));
            }
        } else {
            index = dfs_text_replace(c, data, index);
            newChildren.push(c);
        }
    }
    div.replaceChildren(...newChildren.flat());
    return index;
}

Hooks.once('init', () => {
    libWrapper.register(moduleID, 'ChatLog.prototype._onDiceRollClick', function () { }, 'OVERRIDE');
});


Hooks.on('renderChatMessage', function betterDiceTooltips(message, [html], messageData) {
    if (!message.isRoll && !message.flags['rolls-in-chat']) return;
    
    if (game.modules.get('hide-gm-rolls')?.active && game.settings.get('hide-gm-rolls', 'sanitize-rolls') && !game.user.isGM) return;
    
    const tooltips = html.querySelectorAll('.dice-tooltip');
    for (const tooltip of tooltips) {
        const formulaDiv = tooltip.parentElement.querySelector('div.dice-formula');
        if (!formulaDiv) continue;
        dfs_text_replace(formulaDiv, parseTooltip(tooltip, {
            isMultiattack: message.flags["multiattack-5e"]?.isMultiattack,
        }), 0);
        formulaDiv.classList.add('dice-tooltip');
        const diceRolls = document.createElement('ol');
        diceRolls.classList.add('dice-rolls');
        diceRolls.style = "display: flex; justify-content: center; flex-wrap: wrap";
        diceRolls.replaceChildren(...formulaDiv.childNodes);
        formulaDiv.replaceChildren(diceRolls);

        tooltip.remove();
    }
});
