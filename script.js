const FOLDER = './data/';

const FILES = {
    partes: FOLDER + 'partes_planta.csv',
    enfermedades: FOLDER + 'enfermedades.csv',
    mapeo: FOLDER + 'mapeo_localizacion.csv',
    manifestaciones: FOLDER + 'sintomas_signos.csv',
    criterios: FOLDER + 'manifestacion.csv',
    manejo: FOLDER + 'manejo_seguridad.csv'
};

let db = {};

// ======================================
// PARSER CSV
// ======================================

function parseCSV(text) {

    return text
        .replace(/\r/g, '')
        .trim()
        .split('\n')
        .slice(1)
        .map(line =>

/// posibles problemas
            line.split(',').map(v =>
                v.trim().replace(/^"|"$/g, '')
            )
        );
}

// ======================================
// CARGA ARCHIVOS
// ======================================

async function init() {

    try {

        const textos = await Promise.all(

            Object.values(FILES).map(async file => {

                console.log('Cargando:', file);

                const response =
                    await fetch(file);

                if (!response.ok) {

                    throw new Error(
                        'No se pudo cargar ' + file
                    );
                }

                return response.text();
            })
        );

        const keys =
            Object.keys(FILES);

        keys.forEach((key, i) => {

            db[key] =
                parseCSV(textos[i]);
        });

        console.log('BASE:', db);

        poblarMenuInicial();

    }
    catch(err) {

        console.error(err);

        alert(err.message);

        document.getElementById(
            'select-localizacion'
        ).innerHTML =
            '<option>Error al cargar datos</option>';
    }
}

// ======================================
// MENU PARTE PLANTA
// ======================================

function poblarMenuInicial() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const locId =
        params.get('loc');

    if (!locId) {

        console.error(
            'No se recibió localización'
        );

        return;
    }

    const select =
        document.getElementById(
            'select-localizacion'
        );

    select.innerHTML = '';

    db.partes.forEach(row => {

        const opt =
            document.createElement('option');

        opt.value =
            String(row[0]).trim();

        opt.textContent =
            row[1];

        select.appendChild(opt);
    });

    select.value = locId;

    const parte =
        db.partes.find(row =>
            String(row[0]).trim() ===
            locId
        );

    if (parte) {

        document.getElementById(
            'parte-seleccionada'
        ).textContent =
            parte[1];
    }

    select.dispatchEvent(
        new Event('change')
    );
}

// ======================================
// LOCALIZACION -> MANIFESTACIONES
// ======================================

document.getElementById(
    'select-localizacion'
).addEventListener('change', e => {

    const locId =
        String(e.target.value).trim();

    console.log(
        'LOCALIZACION:',
        locId
    );

    const secSintomas =
        document.getElementById(
            'sec-sintomas'
        );

    const selectSintoma =
        document.getElementById(
            'select-sintoma'
        );

    if (!locId) {

        secSintomas.classList.add(
            'hidden'
        );

        return;
    }

    // ======================================
    // mapeo_localizacion.csv
    //
    // [0] ID interno
    // [1] ID_Enfermedad
    // [2] ID_Localizacion
    // ======================================

    const enfIds = db.mapeo
        .filter(m => {

            return (
                String(m[2]).trim() ===
                locId
            );
        })
        .map(m =>
            String(m[1]).trim()
        );

    console.log(
        'ENFERMEDADES:',
        enfIds
    );

    // ======================================
// manifestacion.csv
//
// [0] ID
// [1] ID_Enfermedad
// [2] ID_Manifestacion
    // ======================================

const manifestacionIds = db.criterios
    .filter(c => {

        return enfIds.includes(
            String(c[1]).trim()
        );
    })
    .map(c =>
        String(c[2]).trim()
    );

const unicos =
    [...new Set(manifestacionIds)];

    ////

selectSintoma.innerHTML =
    '<option value="">Seleccione...</option>';

const galeria =
    document.getElementById(
        'galeria-sintomas'
    );

galeria.innerHTML = '';

unicos.forEach(sId => {


    const sData =
    	db.manifestaciones.find(s => {

       	    return (
                String(s[0]).trim() ===
                sId
            );
       });


    if (!sData) return;
    
    // sigue cargando el select oculto
    const opt =
        document.createElement('option');

    opt.value = sId;
    opt.textContent = sData[1];

    selectSintoma.appendChild(opt);

    // crea la tarjeta visual
    const tarjeta =
        document.createElement('div');

    tarjeta.className =
        'tarjeta-sintoma';

tarjeta.innerHTML = `
    <img src="${sData[4]}" alt="${sData[1]}">

    <h4>${sData[1]}</h4>

    <p>
        <strong>${sData[2]}</strong>
    </p>

    <p>${sData[3]}</p>
`;

    tarjeta.addEventListener(
        'click',
        () => {

            document
                .querySelectorAll(
                    '.tarjeta-sintoma'
                )
                .forEach(t =>
                    t.classList.remove(
                        'tarjeta-seleccionada'
                    )
                );

            tarjeta.classList.add(
                'tarjeta-seleccionada'
            );

            selectSintoma.value = sId;

            selectSintoma.dispatchEvent(
                new Event('change')
            );
        }
    );

    galeria.appendChild(
        tarjeta
    );
});

secSintomas.classList.remove(
    'hidden'
);
    
    ////


    document.getElementById(
        'resultado'
    ).classList.add(
        'hidden'
    );
});

// ======================================
// MANIFESTACION -> DIAGNOSTICO
// ======================================

document.getElementById(
    'select-sintoma'
).addEventListener(
    'change',
    mostrarDiagnostico
);

// ======================================
// MOSTRAR DIAGNOSTICO
// ======================================

function mostrarDiagnostico() {

    const sId =
        String(
            document.getElementById(
                'select-sintoma'
            ).value
        ).trim();


console.log("Manifestación seleccionada:", sId);
console.log("Tabla criterios:", db.criterios);



    const res =
        document.getElementById(
            'resultado'
        );

    if (!sId) return;

    const match =
        db.criterios.find(c => {

            return (
                String(c[2]).trim() ===
                sId
            );
        });

    console.log(
        'MATCH:',
        match
    );

    if (!match) return;

    const eId =
        String(match[1]).trim();

    const eData =
        db.enfermedades.find(e => {

            return (
                String(e[0]).trim() ===
                eId
            );
        });

    const mData =
        db.manejo.find(m => {

            return (
                String(m[1]).trim() ===
                eId
            );
        });

    document.getElementById(
        'diag-nombre'
    ).textContent =
        eData
            ? eData[1]
            : 'No identificado';

    document.getElementById(
        'diag-agente'
    ).textContent =
        eData
            ? 'Agente: ' + eData[2]
            : '';

    document.getElementById(
        'diag-manejo'
    ).textContent =
        mData
            ? mData[2]
            : 'Consulte la guía técnica';

    const alerta =
        document.getElementById(
            'alerta-seguridad'
        );

    const tox =
        mData
            ? mData[4]
            : '';

    alerta.textContent =
        tox
            ? 'Alerta Marbete: ' + tox
            : '';

    alerta.className = '';

    if (
        tox.toLowerCase().includes('verde')
    ) {

        alerta.classList.add(
            'marbete-verde'
        );
    }
    else if (
        tox.toLowerCase().includes('azul')
    ) {

        alerta.classList.add(
            'marbete-azul'
        );
    }
    else if (
        tox.toLowerCase().includes('amarillo')
    ) {

        alerta.classList.add(
            'marbete-amarillo'
        );
    }
    else if (
        tox.toLowerCase().includes('rojo')
    ) {

        alerta.classList.add(
            'marbete-rojo'
        );
    }

    res.classList.remove(
        'hidden'
    );
}

// ======================================
// INICIO
// ======================================

init();
