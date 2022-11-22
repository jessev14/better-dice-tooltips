const moduleID = 'better-dice-tooltips';


Hooks.once('init', () => {
    libWrapper.register(moduleID, 'ChatLog.prototype._onDiceRollClick', function () { }, 'OVERRIDE');
});


Hooks.on('renderChatMessage', (message, [html], messageData) => {
    if (!message.isRoll) return;

    const tooltips = html.querySelectorAll('.dice-tooltip');
    for (const tooltip of tooltips) {
        const newFormula = document.createElement('section');
        newFormula.classList.add('dice-tooltip', 'dice-formula');
        newFormula.style.display = 'block';
        newFormula.innerHTML = `
            <div class="dice">
                <ol class="dice-rolls" style="display:flex; justify-content: center; flex-wrap: wrap;">
                </ol>
            </div>
        `;

        const diceListOl = newFormula.querySelector('ol');
        tooltip.querySelectorAll('li.roll.die').forEach(n => {
            const die = n.cloneNode(true);
            const d = die.classList.value.split(' ').find(c => c.match(/\d/))?.split('d')[1];
            if (d) die.title = `d${d}`;
            diceListOl.append(die);
            const add = document.createElement('li');
            add.classList.add('roll', 'term');
            add.innerText = '+';
            diceListOl.append(add);
        });
        diceListOl.querySelector('li:last-child').remove();

        const formulaDiv = tooltip.previousElementSibling;
        const formulaText = formulaDiv.innerText;
        const formulaParts = formulaText.split(' ');
        let i = 0;
        while (i < formulaParts.length) {
            if (formulaParts[i].includes('d') || !formulaParts[i]) {
                i += 2;
                continue;
            };

            const add = document.createElement('li');
            add.classList.add('roll', 'term');
            add.innerText = formulaParts[i - 1] === '+' ? '+' : '-';
            diceListOl.append(add);

            const term = document.createElement('li');
            term.classList.add('roll', 'term');
            term.innerText = formulaParts[i];
            diceListOl.append(term);

            i += 2;
        }

        const termLis = diceListOl.querySelectorAll('li');
        for (let i = 0; i < termLis.length; i++) {
            if (!termLis[i].classList.contains('discarded')) continue;

            if (termLis[i - 1]) termLis[i - 1].remove();
            else termLis[i + 1].remove();

            //termLis[i].innerText = '(' + termLis[i].innerText + ')';
        }

        formulaDiv.after(newFormula);
        formulaDiv.remove();
        tooltip.remove();
    }
});
