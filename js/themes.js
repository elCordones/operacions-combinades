(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});

  function svgWrap(body) {
    return (
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      body +
      '</svg>'
    );
  }

  const THEMES = {
    cosmos: {
      id: 'cosmos',
      name: 'Missió Cosmos',
      tagline: 'Equipa la nau estel·lar pas a pas',
      shortDesc: 'Supera cada repte per instal·lar mòduls a la teva nau d’exploració galàctica.',
      iconSvg: svgWrap(
        '<circle cx="32" cy="32" r="26" fill="#0f2942" stroke="#38bdf8" stroke-width="2.5"/>' +
        '<path d="M32 13c7 8 10 17 10 25l-10 6-10-6c0-8 3-17 10-25Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>' +
        '<circle cx="32" cy="27" r="4.5" fill="#0284c7"/>' +
        '<path d="M22 35l-6 7 6 2M42 35l6 7-6 2" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M28 45l4 8 4-8" fill="#f59e0b"/>'
      ),
      trophies: [
        {
          id: 'cosmos-1',
          name: 'Brúixola Orbital',
          desc: 'Guia de navegació d’esquerra a dreta',
          svg: svgWrap(
            '<circle cx="32" cy="32" r="24" fill="#0c2d48" stroke="#38bdf8" stroke-width="2.5"/>' +
            '<polygon points="32,12 38,32 32,29 26,32" fill="#f59e0b"/>' +
            '<polygon points="32,52 38,32 32,35 26,32" fill="#bae6fd"/>' +
            '<circle cx="32" cy="32" r="3.5" fill="#ffffff"/>'
          )
        },
        {
          id: 'cosmos-2',
          name: 'Propulsor Iònic',
          desc: 'Potència extra per multiplicar i dividir',
          svg: svgWrap(
            '<rect x="20" y="14" width="24" height="28" rx="6" fill="#1e3a5f" stroke="#38bdf8" stroke-width="2.5"/>' +
            '<path d="M26 42l6 12 6-12" fill="#fb923c"/>' +
            '<circle cx="32" cy="28" r="6" fill="#7dd3fc"/>'
          )
        },
        {
          id: 'cosmos-3',
          name: 'Escut de Parèntesis',
          desc: 'Camp deflector de prioritat absoluta',
          svg: svgWrap(
            '<path d="M32 10l18 7v14c0 12-7.5 20-18 23-10.5-3-18-11-18-23V17l18-7Z" fill="#0f3460" stroke="#38bdf8" stroke-width="2.5"/>' +
            '<path d="M25 22c-4 5-4 15 0 20M39 22c4 5 4 15 0 20" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>'
          )
        },
        {
          id: 'cosmos-4',
          name: 'Nucli Exponencial',
          desc: 'Reactor d’energia quadrada i cúbica',
          svg: svgWrap(
            '<circle cx="32" cy="32" r="20" fill="#162d4c" stroke="#38bdf8" stroke-width="2.5"/>' +
            '<ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(30 32 32)" stroke="#7dd3fc" stroke-width="2"/>' +
            '<ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(-30 32 32)" stroke="#7dd3fc" stroke-width="2"/>' +
            '<circle cx="32" cy="32" r="6" fill="#fbbf24"/>'
          )
        },
        {
          id: 'cosmos-5',
          name: 'Radar Quàntic',
          desc: 'Domini complet de tota la piràmide',
          svg: svgWrap(
            '<circle cx="32" cy="32" r="23" fill="#0f2942" stroke="#38bdf8" stroke-width="2.5"/>' +
            '<circle cx="32" cy="32" r="14" stroke="#7dd3fc" stroke-width="1.8" stroke-dasharray="4 3"/>' +
            '<path d="M32 32l14-14" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>' +
            '<circle cx="46" cy="18" r="3.5" fill="#4ade80"/>'
          )
        },
        {
          id: 'cosmos-6',
          name: 'Estrella Comandant',
          desc: 'Màxima condecoració intergalàctica',
          svg: svgWrap(
            '<polygon points="32,8 39,23 55,25 43,36 46,53 32,45 18,53 21,36 9,25 25,23" fill="#fbbf24" stroke="#b45309" stroke-width="2.5" stroke-linejoin="round"/>' +
            '<circle cx="32" cy="31" r="6" fill="#0f2942"/>'
          )
        }
      ],
      assembly: {
        title: 'Munta la Nau Estel·lar!',
        subtitle: 'Acobla cada mòdul al seu lloc del plànol recordant el poder matemàtic que has superat.',
        finalName: 'Nau Estel·lar Operativa',
        finalDesc: 'Tots els sistemes de càlcul estan acoblats i llestos per viatjar per la galàxia!',
        blueprintSvg:
          '<svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="16" y="16" width="368" height="268" rx="18" stroke="currentColor" stroke-opacity="0.16" stroke-dasharray="6 6"/>' +
          '<path d="M200 34C244 74 266 130 266 208L200 242L134 208C134 130 156 74 200 34Z" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-opacity="0.32" stroke-width="2.5"/>' +
          '<path d="M134 166L66 218L134 214M266 166L334 218L266 214" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.28" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<path d="M200 60V246M80 156H320M320 60L200 156" stroke="currentColor" stroke-opacity="0.16" stroke-width="1.8" stroke-dasharray="5 5"/>' +
          '<circle cx="200" cy="156" r="40" stroke="currentColor" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="4 4"/>' +
          '</svg>',
        finalSvg:
          '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="60" cy="60" r="54" fill="#0c2d48" stroke="#38bdf8" stroke-width="3"/>' +
          '<circle cx="26" cy="30" r="2.2" fill="#bae6fd"/><circle cx="94" cy="36" r="2" fill="#fde047"/><circle cx="24" cy="84" r="2" fill="#7dd3fc"/>' +
          '<path d="M36 74L20 92L40 86M84 74L100 92L80 86" fill="#0284c7" stroke="#7dd3fc" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<path d="M60 18C77 36 86 58 86 84L60 96L34 84C34 58 43 36 60 18Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"/>' +
          '<circle cx="60" cy="54" r="11" fill="#0369a1" stroke="#fbbf24" stroke-width="2.5"/>' +
          '<path d="M49 94L60 112L71 94" fill="#fb923c" stroke="#fde047" stroke-width="2" stroke-linejoin="round"/>' +
          '<polygon points="88,20 91,26 98,27 93,31 94,38 88,35 82,38 83,31 78,27 85,26" fill="#fbbf24"/>' +
          '</svg>',
        slots: [
          { idx: 0, x: 50, y: 20, zoneLabel: 'Cabina de rumb' },
          { idx: 1, x: 50, y: 82, zoneLabel: 'Base propulsora' },
          { idx: 2, x: 19, y: 52, zoneLabel: 'Ala deflectora' },
          { idx: 3, x: 50, y: 52, zoneLabel: 'Reactor central' },
          { idx: 4, x: 81, y: 52, zoneLabel: 'Ala de rastreig' },
          { idx: 5, x: 81, y: 20, zoneLabel: 'Insígnia estel·lar' }
        ]
      }
    },

    lab: {
      id: 'lab',
      name: 'El Gran Laboratori',
      tagline: 'Descobreix fórmules i elements purs',
      shortDesc: 'Combina reactius matemàtics amb precisió per crear pocions i cristalls.',
      iconSvg: svgWrap(
        '<path d="M25 14h14M27 14v12l-11 20a4 4 0 0 0 3.5 6h25a4 4 0 0 0 3.5-6L37 26V14" fill="#ecfdf5" stroke="#0f766e" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M20 39h24l4 7a2 2 0 0 1-1.7 3H17.7a2 2 0 0 1-1.7-3l4-7Z" fill="#14b8a6"/>' +
        '<circle cx="29" cy="43" r="2.5" fill="#fef08a"/><circle cx="36" cy="45" r="2" fill="#fef08a"/>'
      ),
      trophies: [
        {
          id: 'lab-1',
          name: 'Proveta Equilibrada',
          desc: 'Mesura exacta d’esquerra a dreta',
          svg: svgWrap(
            '<rect x="25" y="10" width="14" height="42" rx="7" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/>' +
            '<rect x="27" y="29" width="10" height="21" rx="5" fill="#14b8a6"/>' +
            '<path d="M22 10h20" stroke="#0f766e" stroke-width="3" stroke-linecap="round"/>'
          )
        },
        {
          id: 'lab-2',
          name: 'Cristall Catalitzador',
          desc: 'Accelera multiplicacions i divisions',
          svg: svgWrap(
            '<polygon points="32,8 48,24 41,54 23,54 16,24" fill="#99f6e4" stroke="#0f766e" stroke-width="2.5" stroke-linejoin="round"/>' +
            '<path d="M32 8v46M16 24h32" stroke="#0d9488" stroke-width="1.8"/>'
          )
        },
        {
          id: 'lab-3',
          name: 'Càpsula de Prioritat',
          desc: 'Aïlla els parèntesis amb precisió',
          svg: svgWrap(
            '<circle cx="32" cy="32" r="21" fill="#ecfdf5" stroke="#0f766e" stroke-width="2.5"/>' +
            '<rect x="20" y="22" width="24" height="20" rx="10" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>'
          )
        },
        {
          id: 'lab-4',
          name: 'Elixir Quadrat',
          desc: 'Domini de potències i arrels pures',
          svg: svgWrap(
            '<path d="M26 12h12v10l12 16a12 12 0 0 1-10 18H24a12 12 0 0 1-10-18l12-16V12Z" fill="#ccfbf1" stroke="#0f766e" stroke-width="2.5"/>' +
            '<circle cx="32" cy="40" r="9" fill="#0d9488"/>'
          )
        },
        {
          id: 'lab-5',
          name: 'Microscopi Màster',
          desc: 'Observació rigorosa de la jerarquia',
          svg: svgWrap(
            '<path d="M20 50h24M32 42v8" stroke="#0f766e" stroke-width="3.5" stroke-linecap="round"/>' +
            '<rect x="28" y="13" width="9" height="22" rx="3" transform="rotate(20 32 24)" fill="#14b8a6" stroke="#0f766e" stroke-width="2"/>' +
            '<path d="M39 20a13 13 0 0 1 0 22" stroke="#0f766e" stroke-width="3" stroke-linecap="round"/>'
          )
        },
        {
          id: 'lab-6',
          name: 'Fórmula d’Or',
          desc: 'Medalla suprema del Gran Laboratori',
          svg: svgWrap(
            '<polygon points="32,9 51,20 51,44 32,55 13,44 13,20" fill="#fbbf24" stroke="#92400e" stroke-width="2.5"/>' +
            '<circle cx="32" cy="32" r="10" fill="#fef3c7" stroke="#0f766e" stroke-width="2"/>'
          )
        }
      ],
      assembly: {
        title: 'Completa l’Estació d’Alquímia!',
        subtitle: 'Col·loca cada reactiu i instrument al banc del laboratori seguint la jerarquia.',
        finalName: 'Fórmula Mestra Activada',
        finalDesc: 'Tots els elements purs s’han combinat amb precisió sense cap error de reacció!',
        blueprintSvg:
          '<svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="16" y="16" width="368" height="268" rx="18" stroke="currentColor" stroke-opacity="0.16" stroke-dasharray="6 6"/>' +
          '<rect x="44" y="54" width="312" height="192" rx="16" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.26" stroke-width="2.5"/>' +
          '<path d="M76 75H324M76 225H324M76 75V225M200 75V225M324 75V225" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="5 5"/>' +
          '<circle cx="200" cy="150" r="34" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-opacity="0.28" stroke-width="2"/>' +
          '</svg>',
        finalSvg:
          '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="60" cy="60" r="54" fill="#0f3632" stroke="#2dd4bf" stroke-width="3"/>' +
          '<path d="M46 24H74M50 24V46L28 84A10 10 0 0 0 36.5 98H83.5A10 10 0 0 0 92 84L70 46V24" fill="#ccfbf1" stroke="#14b8a6" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M37 74H83L90 86A6 6 0 0 1 85 95H35A6 6 0 0 1 30 86L37 74Z" fill="#fbbf24"/>' +
          '<circle cx="52" cy="83" r="4" fill="#fef08a"/><circle cx="67" cy="86" r="3" fill="#ffffff"/><circle cx="60" cy="60" r="4" fill="#2dd4bf"/>' +
          '</svg>',
        slots: [
          { idx: 0, x: 19, y: 25, zoneLabel: 'Suport d’entrada' },
          { idx: 1, x: 50, y: 25, zoneLabel: 'Cambra catalitzadora' },
          { idx: 2, x: 81, y: 25, zoneLabel: 'Filtre de prioritat' },
          { idx: 3, x: 19, y: 75, zoneLabel: 'Matràs d’energia' },
          { idx: 4, x: 50, y: 75, zoneLabel: 'Visor d’anàlisi' },
          { idx: 5, x: 81, y: 75, zoneLabel: 'Segell mestre' }
        ]
      }
    },

    expedicio: {
      id: 'expedicio',
      name: 'Expedició Perduda',
      tagline: 'Desxifra el temple antic',
      shortDesc: 'Obre les cambres secretes d’una civilització oblidada resolent jeroglífics numèrics.',
      iconSvg: svgWrap(
        '<path d="M12 50h40L46 22H18L12 50Z" fill="#fef3c7" stroke="#92400e" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M22 22l4-10h12l4 10" fill="#fde68a" stroke="#92400e" stroke-width="2.5"/>' +
        '<rect x="27" y="34" width="10" height="16" fill="#92400e"/>'
      ),
      trophies: [
        {
          id: 'exp-1',
          name: 'Mapa de Pergamí',
          desc: 'Traça la ruta d’esquerra a dreta',
          svg: svgWrap(
            '<rect x="14" y="15" width="36" height="34" rx="4" fill="#fef3c7" stroke="#92400e" stroke-width="2.5"/>' +
            '<path d="M22 39c4-10 14-4 20-15" stroke="#b45309" stroke-width="2.5" stroke-dasharray="4 3" stroke-linecap="round"/>' +
            '<path d="M39 21l6 6M45 21l-6 6" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>'
          )
        },
        {
          id: 'exp-2',
          name: 'Clau de Bronze',
          desc: 'Obre les portes de × i ÷',
          svg: svgWrap(
            '<circle cx="24" cy="24" r="10" fill="#fcd34d" stroke="#92400e" stroke-width="2.5"/>' +
            '<circle cx="24" cy="24" r="4" fill="#fef3c7"/>' +
            '<path d="M31 31l19 19M43 43l5-5M47 47l5-5" stroke="#92400e" stroke-width="3.5" stroke-linecap="round"/>'
          )
        },
        {
          id: 'exp-3',
          name: 'Segell dels Parèntesis',
          desc: 'Inscripció sagrada prioritària',
          svg: svgWrap(
            '<circle cx="32" cy="32" r="22" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>' +
            '<circle cx="32" cy="32" r="15" fill="#fef3c7" stroke="#92400e" stroke-width="1.8"/>' +
            '<path d="M27 24c-3 4-3 12 0 16M37 24c3 4 3 12 0 16" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>'
          )
        },
        {
          id: 'exp-4',
          name: 'Tòtem de l’Arrel',
          desc: 'Relíquia de potències i arrels',
          svg: svgWrap(
            '<rect x="20" y="12" width="24" height="40" rx="4" fill="#fde68a" stroke="#78350f" stroke-width="2.5"/>' +
            '<path d="M25 23h14M25 32h14M25 41h14" stroke="#92400e" stroke-width="2.5" stroke-linecap="round"/>' +
            '<circle cx="32" cy="18" r="2.5" fill="#b45309"/>'
          )
        },
        {
          id: 'exp-5',
          name: 'Escarabat de Jade',
          desc: 'Amulets de jerarquia completa',
          svg: svgWrap(
            '<ellipse cx="32" cy="34" rx="14" ry="18" fill="#10b981" stroke="#065f46" stroke-width="2.5"/>' +
            '<path d="M32 16v36M18 28h28" stroke="#065f46" stroke-width="2"/>' +
            '<circle cx="32" cy="14" r="5" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>'
          )
        },
        {
          id: 'exp-6',
          name: 'Corona del Temple',
          desc: 'Tresor suprem de l’expedició',
          svg: svgWrap(
            '<path d="M12 45L16 20l10 10 6-14 6 14 10-10 4 25H12Z" fill="#fbbf24" stroke="#78350f" stroke-width="2.5" stroke-linejoin="round"/>' +
            '<circle cx="32" cy="36" r="3.5" fill="#dc2626"/>'
          )
        }
      ],
      assembly: {
        title: 'Obre el Portal del Temple!',
        subtitle: 'Encaixa les relíquies antigues al mur de pedra per revelar el tresor ocult.',
        finalName: 'Portal del Temple Obert',
        finalDesc: 'Has desxifrat totes les inscripcions i el tresor del temple brilla davant teu!',
        blueprintSvg:
          '<svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="16" y="16" width="368" height="268" rx="18" stroke="currentColor" stroke-opacity="0.16" stroke-dasharray="6 6"/>' +
          '<path d="M52 252L76 62H324L348 252H52Z" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-opacity="0.3" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<rect x="148" y="128" width="104" height="124" rx="10" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.28" stroke-width="2"/>' +
          '<path d="M76 72H324M76 222H324" stroke="currentColor" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="5 5"/>' +
          '</svg>',
        finalSvg:
          '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="60" cy="60" r="54" fill="#3b2608" stroke="#f59e0b" stroke-width="3"/>' +
          '<path d="M22 94L32 38H88L98 94H22Z" fill="#fde68a" stroke="#b45309" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M40 38L48 22H72L80 38" fill="#fcd34d" stroke="#b45309" stroke-width="2.5"/>' +
          '<rect x="44" y="54" width="32" height="40" rx="4" fill="#78350f"/>' +
          '<path d="M45 76L49 62L56 69L60 58L64 69L71 62L75 76H45Z" fill="#fbbf24" stroke="#fef3c7" stroke-width="1.5"/>' +
          '<circle cx="60" cy="70" r="3" fill="#dc2626"/>' +
          '</svg>',
        slots: [
          { idx: 0, x: 19, y: 24, zoneLabel: 'Relleu de ruta' },
          { idx: 1, x: 81, y: 24, zoneLabel: 'Pany superior' },
          { idx: 2, x: 50, y: 24, zoneLabel: 'Clau de volta' },
          { idx: 3, x: 19, y: 74, zoneLabel: 'Pilar esquerre' },
          { idx: 4, x: 81, y: 74, zoneLabel: 'Pilar dret' },
          { idx: 5, x: 50, y: 74, zoneLabel: 'Altar central' }
        ]
      }
    },

    codi: {
      id: 'codi',
      name: 'Mestre del Codi',
      tagline: 'Construeix el teu robot intel·ligent',
      shortDesc: 'Programa i assembla tots els components del robot lògic peça a peça.',
      iconSvg: svgWrap(
        '<rect x="16" y="18" width="32" height="28" rx="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="2.5"/>' +
        '<path d="M32 10v8" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="9" r="3" fill="#2563eb"/>' +
        '<circle cx="25" cy="30" r="3.5" fill="#2563eb"/><circle cx="39" cy="30" r="3.5" fill="#2563eb"/>' +
        '<rect x="24" y="38" width="16" height="3.5" rx="1.5" fill="#0f172a"/>'
      ),
      trophies: [
        {
          id: 'codi-1',
          name: 'Sensor Òptic',
          desc: 'Lectura ordenada d’esquerra a dreta',
          svg: svgWrap(
            '<rect x="12" y="20" width="40" height="24" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="2.5"/>' +
            '<circle cx="24" cy="32" r="5" fill="#38bdf8"/><circle cx="40" cy="32" r="5" fill="#38bdf8"/>'
          )
        },
        {
          id: 'codi-2',
          name: 'Braç Articulat',
          desc: 'Precisió en multiplicacions i divisions',
          svg: svgWrap(
            '<path d="M18 48l10-16 14-12" stroke="#1e293b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<circle cx="28" cy="32" r="5" fill="#3b82f6"/><circle cx="42" cy="20" r="5" fill="#f59e0b"/>'
          )
        },
        {
          id: 'codi-3',
          name: 'Xip de Prioritat',
          desc: 'Processa els parèntesis abans que res',
          svg: svgWrap(
            '<rect x="18" y="18" width="28" height="28" rx="4" fill="#1e293b" stroke="#2563eb" stroke-width="2.5"/>' +
            '<rect x="25" y="25" width="14" height="14" rx="2" fill="#60a5fa"/>' +
            '<path d="M24 12v6M32 12v6M40 12v6M24 46v6M32 46v6M40 46v6" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>'
          )
        },
        {
          id: 'codi-4',
          name: 'Bateria Quàntica',
          desc: 'Energia de potències i arrels',
          svg: svgWrap(
            '<rect x="19" y="14" width="26" height="38" rx="4" fill="#0f172a" stroke="#2563eb" stroke-width="2.5"/>' +
            '<rect x="26" y="10" width="12" height="4" rx="1" fill="#64748b"/>' +
            '<path d="M34 21l-7 11h6l-2 11 8-12h-6l1-10Z" fill="#facc15"/>'
          )
        },
        {
          id: 'codi-5',
          name: 'Placa Base Pro',
          desc: 'Arquitectura completa sense errors',
          svg: svgWrap(
            '<rect x="12" y="12" width="40" height="40" rx="6" fill="#0f766e" stroke="#134e4a" stroke-width="2.5"/>' +
            '<circle cx="24" cy="24" r="4" fill="#fde047"/><circle cx="40" cy="40" r="4" fill="#fde047"/>' +
            '<path d="M24 28v12h12" stroke="#99f6e4" stroke-width="2.5" stroke-linecap="round"/>'
          )
        },
        {
          id: 'codi-6',
          name: 'Nucli d’IA Mestre',
          desc: 'Robot activat al 100%!',
          svg: svgWrap(
            '<circle cx="32" cy="32" r="22" fill="#1e293b" stroke="#fbbf24" stroke-width="3"/>' +
            '<polygon points="32,16 44,24 44,40 32,48 20,40 20,24" fill="#3b82f6" stroke="#93c5fd" stroke-width="2"/>' +
            '<circle cx="32" cy="32" r="5" fill="#fbbf24"/>'
          )
        }
      ],
      assembly: {
        title: 'Assembla i Activa el Robot!',
        subtitle: 'Connecta cada mòdul al xassís segons la seva funció lògica.',
        finalName: 'Robot Intel·ligent Activat',
        finalDesc: 'Tots els circuits i processadors de jerarquia funcionen al 100%!',
        blueprintSvg:
          '<svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="16" y="16" width="368" height="268" rx="18" stroke="currentColor" stroke-opacity="0.16" stroke-dasharray="6 6"/>' +
          '<rect x="150" y="34" width="100" height="60" rx="14" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-opacity="0.3" stroke-width="2.5"/>' +
          '<rect x="128" y="106" width="144" height="106" rx="16" fill="currentColor" fill-opacity="0.06" stroke="currentColor" stroke-opacity="0.3" stroke-width="2.5"/>' +
          '<path d="M76 156H128M272 156H324M200 94V106M160 212L104 246M240 212L296 246" stroke="currentColor" stroke-opacity="0.24" stroke-width="2.5" stroke-dasharray="5 5"/>' +
          '</svg>',
        finalSvg:
          '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="60" cy="60" r="54" fill="#13284d" stroke="#60a5fa" stroke-width="3"/>' +
          '<path d="M60 16V28" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="14" r="4" fill="#fbbf24"/>' +
          '<rect x="34" y="28" width="52" height="32" rx="10" fill="#e2e8f0" stroke="#3b82f6" stroke-width="2.5"/>' +
          '<circle cx="48" cy="44" r="5" fill="#2563eb"/><circle cx="72" cy="44" r="5" fill="#2563eb"/>' +
          '<rect x="28" y="64" width="64" height="34" rx="10" fill="#1e293b" stroke="#60a5fa" stroke-width="2.5"/>' +
          '<polygon points="60,71 71,78 71,88 60,94 49,88 49,78" fill="#3b82f6" stroke="#fbbf24" stroke-width="2"/>' +
          '<circle cx="60" cy="82.5" r="4" fill="#fbbf24"/>' +
          '</svg>',
        slots: [
          { idx: 0, x: 50, y: 20, zoneLabel: 'Cap òptic' },
          { idx: 1, x: 19, y: 52, zoneLabel: 'Braç mecànic' },
          { idx: 2, x: 50, y: 52, zoneLabel: 'Tòrax lògic' },
          { idx: 3, x: 81, y: 52, zoneLabel: 'Mòdul d’energia' },
          { idx: 4, x: 25, y: 82, zoneLabel: 'Xassís base' },
          { idx: 5, x: 75, y: 82, zoneLabel: 'Nucli quàntic' }
        ]
      }
    },

    classic: {
      id: 'classic',
      name: 'Mode Clàssic (DUA)',
      tagline: 'Estètica neta sense distraccions',
      shortDesc: 'Disseny minimalista i d’alt contrast ideal per a una concentració tranquil·la.',
      iconSvg: svgWrap(
        '<circle cx="32" cy="32" r="22" fill="#f1f5f9" stroke="#334155" stroke-width="2.5"/>' +
        '<path d="M22 33l7 7 14-15" stroke="#1d4ed8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
      ),
      trophies: [
        {
          id: 'cls-1',
          name: 'Fita 1 · Ordre',
          desc: 'Lectura lineal d’esquerra a dreta',
          svg: svgWrap('<circle cx="32" cy="32" r="21" fill="#e2e8f0" stroke="#334155" stroke-width="2.5"/><text x="32" y="39" text-anchor="middle" font-size="22" font-weight="700" fill="#1e293b">1</text>')
        },
        {
          id: 'cls-2',
          name: 'Fita 2 · Prioritat',
          desc: 'Domini de × i ÷',
          svg: svgWrap('<circle cx="32" cy="32" r="21" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2.5"/><text x="32" y="39" text-anchor="middle" font-size="22" font-weight="700" fill="#1e3a8a">2</text>')
        },
        {
          id: 'cls-3',
          name: 'Fita 3 · Parèntesis',
          desc: 'Control absolut dels blocs ( )',
          svg: svgWrap('<circle cx="32" cy="32" r="21" fill="#dcfce7" stroke="#15803d" stroke-width="2.5"/><text x="32" y="39" text-anchor="middle" font-size="22" font-weight="700" fill="#14532d">3</text>')
        },
        {
          id: 'cls-4',
          name: 'Fita 4 · Potències i Arrels',
          desc: 'Càlcul d’aⁿ i √',
          svg: svgWrap('<circle cx="32" cy="32" r="21" fill="#fef3c7" stroke="#b45309" stroke-width="2.5"/><text x="32" y="39" text-anchor="middle" font-size="22" font-weight="700" fill="#78350f">4</text>')
        },
        {
          id: 'cls-5',
          name: 'Fita 5 · Jerarquia',
          desc: 'Integració dels 4 nivells',
          svg: svgWrap('<circle cx="32" cy="32" r="21" fill="#e0f2fe" stroke="#0369a1" stroke-width="2.5"/><text x="32" y="39" text-anchor="middle" font-size="22" font-weight="700" fill="#0c4a6e">5</text>')
        },
        {
          id: 'cls-6',
          name: 'Fita 6 · Mestre',
          desc: 'Repte complet superat',
          svg: svgWrap('<circle cx="32" cy="32" r="21" fill="#fef08a" stroke="#a16207" stroke-width="2.5"/><path d="M23 33l6 6 12-13" stroke="#854d0e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>')
        }
      ],
      assembly: {
        title: 'Construeix la Piràmide de Mestratge',
        subtitle: 'Ordena les fites aconseguides al mapa visual de la sessió.',
        finalName: 'Piràmide de Mestratge Completa',
        finalDesc: 'Has consolidat tots els graons de les operacions combinades amb serenor i precisió.',
        blueprintSvg:
          '<svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="16" y="16" width="368" height="268" rx="18" stroke="currentColor" stroke-opacity="0.16" stroke-dasharray="6 6"/>' +
          '<polygon points="200,32 356,258 44,258" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.28" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<path d="M138 118H262M92 188H308" stroke="currentColor" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="5 5"/>' +
          '</svg>',
        finalSvg:
          '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="60" cy="60" r="54" fill="#eff6ff" stroke="#1e40af" stroke-width="3"/>' +
          '<polygon points="60,20 100,90 20,90" fill="#dbeafe" stroke="#1e40af" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M44 50H76M32 70H88" stroke="#1e40af" stroke-width="2.5"/>' +
          '<circle cx="60" cy="37" r="7" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>' +
          '<path d="M47 78L55 86L73 67" stroke="#15803d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>',
        slots: [
          { idx: 0, x: 19, y: 78, zoneLabel: 'Base 1' },
          { idx: 1, x: 50, y: 78, zoneLabel: 'Base 2' },
          { idx: 2, x: 81, y: 78, zoneLabel: 'Base 3' },
          { idx: 3, x: 34, y: 48, zoneLabel: 'Graó mitjà A' },
          { idx: 4, x: 66, y: 48, zoneLabel: 'Graó mitjà B' },
          { idx: 5, x: 50, y: 20, zoneLabel: 'Cim mestre' }
        ]
      }
    }
  };

  function getTheme(themeId) {
    return THEMES[themeId] || THEMES.cosmos;
  }

  function getAllThemes() {
    return Object.values(THEMES);
  }

  OpComb.Themes = {
    THEMES,
    getTheme,
    getAllThemes
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
