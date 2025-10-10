function showSplashAnimEcoGestor(palavras, nomeFinal, onFinish, tempoMinimo = 3500) {
    const splash = document.getElementById("splash");
    const el = document.getElementById("ecoLogoAnim");
    el.innerHTML = "";
    splash.style.opacity = 1;
    splash.style.display = "flex";
    let tempoSplash = Date.now();

    function typeString(str, velocidade, cb) {
        el.textContent = "";
        let idx = 0;
        function nextChar() {
            if (idx < str.length) {
                el.textContent += str[idx];
                idx++;
                setTimeout(nextChar, velocidade);
            } else {
                setTimeout(() => cb && cb(), 120);
            }
        }
        nextChar();
    }

    function digitarPalavras(index) {
        if (index < palavras.length) {
            const velocidade = Math.max(8, 22 - index * 0.3);
            typeString(palavras[index], velocidade, () => digitarPalavras(index + 1));
        } else {
            setTimeout(() => {
                el.textContent = "";
                setTimeout(() => {
                    digitarEcoGestor();
                }, 900);
            }, 500);
        }
    }

    function digitarEcoGestor() {
        el.innerHTML = '';
        const leaf = document.createElement('i');
        leaf.className = 'fa fa-leaf text-success eco-leaf-anim';
        leaf.style.opacity = "0";
        leaf.style.marginRight = "0.25em";
        el.appendChild(leaf);

        setTimeout(() => {
            leaf.style.opacity = "1";
            leaf.style.transform = "scale(1) rotate(0deg)";
        }, 200);

        let idx = 0;
        function nextChar() {
            if (idx < nomeFinal.length) {
                el.appendChild(document.createTextNode(nomeFinal[idx]));
                idx++;
                setTimeout(nextChar, 220);
            } else {
                finalizarSplash();
            }
        }
        setTimeout(nextChar, 380);
    }

    function finalizarSplash() {
        const tempoPassado = Date.now() - tempoSplash;
        const espera = Math.max(0, tempoMinimo - tempoPassado);
        setTimeout(() => {
            splash.style.opacity = 0;
            setTimeout(() => {
                splash.style.display = "none";
                if (onFinish) onFinish();
            }, 700);
        }, espera);
    }

    digitarPalavras(0);
}