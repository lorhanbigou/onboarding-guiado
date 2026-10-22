/* =========================================================================
   DATAS DE REPASSE — 2º dia útil de cada mês
   Não contam como dia útil: sábados, domingos e feriados nacionais.
   (Os municipais de TREINO.feriados valem só para a antecipação.)
   ========================================================================= */
(function () {
  // Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher)
  function pascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(ano, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  }

  const chave = (d) => `${d.getMonth() + 1}-${d.getDate()}`;

  function feriados(ano) {
    const sexta = pascoa(ano);
    sexta.setDate(sexta.getDate() - 2);
    return {
      '1-1': L('Confraternização Universal', 'Año Nuevo'),
      [chave(sexta)]: L('Paixão de Cristo', 'Viernes Santo'),
      '4-21': 'Tiradentes',
      '5-1': L('Dia Mundial do Trabalho', 'Día del Trabajador'),
      '9-7': L('Independência do Brasil', 'Independencia de Brasil'),
      '10-12': L('Nossa Senhora Aparecida', 'Nuestra Señora Aparecida'),
      '11-2': L('Finados', 'Día de los Difuntos'),
      '11-15': L('Proclamação da República', 'Proclamación de la República'),
      '11-20': L('Dia Nacional de Zumbi e da Consciência Negra', 'Día de Zumbi y de la Conciencia Negra'),
      '12-25': L('Natal', 'Navidad'),
    };
  }

  // Um item por mês: data do repasse e os feriados (em dia de semana) que empurraram a data
  function datas(ano) {
    const fer = feriados(ano);
    return Array.from({ length: 12 }, (_, mes) => {
      const d = new Date(ano, mes, 1);
      const pulados = [];
      let uteis = 0;
      for (;;) {
        const dia = d.getDay(), f = fer[chave(d)];
        if (dia !== 0 && dia !== 6 && !f) { if (++uteis === 2) break; }
        else if (f && dia !== 0 && dia !== 6) pulados.push({ nome: f, dia: d.getDate() });
        d.setDate(d.getDate() + 1);
      }
      return { data: new Date(d), feriados: pulados };
    });
  }

  TREINO.repasses = { datas, anos: [2026, 2027] };
})();
