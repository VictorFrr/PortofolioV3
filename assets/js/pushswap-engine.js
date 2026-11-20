// ===========================================================
//  PUSH_SWAP — moteur de la démo
//
//  1) SOURCE : ton vrai code C (affiché dans le panneau « gdb »).
//  2) trace() : rejoue exactement cet algorithme, ligne par ligne, et
//     enregistre chaque étape (ligne en cours, variables locales, piles).
//
//  Si tu modifies le C dans SOURCE, garde les lignes que trace() cherche
//  (voir les L('fonction', 'texte de la ligne') plus bas) : elles sont
//  retrouvées par leur texte, pas par leur numéro.
// ===========================================================

export const SOURCE_FILE = "meduim.c";

export const SOURCE = `#include "swap.h"

void	chunktob(t_borne *borne, t_stack **a,
		t_stack **b, t_bench *bench)
{
	t_stack	*tmpa;
	int		i;

	i = 0;
	while (i < borne -> max - borne -> min + 1)
	{
		tmpa = *a;
		if (tmpa -> index <= borne -> max)
		{
			if (tmpa -> index <= (borne -> min + borne -> max) / 2)
			{
				pb(a, b, bench);
				rb(b, bench);
			}
			else
				pb(a, b, bench);
			i++;
		}
		else
			ra(a, bench);
	}
}

int	higher(t_stack *a)
{
	t_stack		*tmp;
	int			i;
	int			j;
	int			k;

	i = 0;
	j = 0;
	k = 0;
	tmp = a;
	while (tmp)
	{
		if (i < tmp -> index)
		{
			i = tmp -> index;
			k = j;
		}
		tmp = tmp -> next;
		j++;
	}
	return (k);
}

void	chunk(t_stack **a, t_stack **b, t_bench *bench)
{
	int			i;
	int			j;
	int			k;
	int			n;
	t_borne		*borne;

	borne = malloc(sizeof(t_borne));
	n = ft_size(*a);
	j = 0;
	k = ft_sqrt(n) / 2;
	if (k < 1)
		k = 1;
	i = n / k;
	ft_index(a);
	while (j < k - 1)
	{
		borne -> min = (j * (i));
		borne -> max = borne -> min + (i - 1);
		chunktob(borne, a, b, bench);
		j++;
	}
	borne -> min = (j * (i));
	borne -> max = n - 1;
	chunktob(borne, a, b, bench);
	free(borne);
}

void	btoa(t_stack **b, int max, t_bench *bench)
{
	int	j;

	j = 0;
	if (max <= (ft_size(*b) / 2))
	{
		while (j < max)
		{
			rb(b, bench);
			j++;
		}
	}
	else
	{
		while (j < (ft_size(*b) - max))
		{
			rrb(b, bench);
			j++;
		}
	}
}

void	meduim(t_stack **a, t_stack **b, t_bench *bench)
{
	int			i;

	i = 0;
	chunk(a, b, bench);
	while (*b)
	{
		i = higher(*b);
		btoa(b, i, bench);
		pa(a, b, bench);
	}
}
`;

// ---------- Retrouver une ligne du C par son texte ----------
const LINES = SOURCE.split("\n");
const norm = (s) => s.replace(/\s+/g, " ").trim();
const FN_START = {
  chunktob: /^void\tchunktob\(/,
  higher: /^int\thigher\(/,
  chunk: /^void\tchunk\(/,
  btoa: /^void\tbtoa\(/,
  meduim: /^void\tmeduim\(/,
};
const RANGE = {};
{
  const starts = Object.entries(FN_START)
    .map(([fn, re]) => [fn, LINES.findIndex((l) => re.test(l))])
    .sort((x, y) => x[1] - y[1]);
  starts.forEach(([fn, s], i) => {
    RANGE[fn] = [s, i + 1 < starts.length ? starts[i + 1][1] : LINES.length];
  });
}
function L(fn, text, nth = 0) {
  const [s, e] = RANGE[fn];
  const want = norm(text);
  let seen = 0;
  for (let i = s; i < e; i++) {
    if (norm(LINES[i]) === want && seen++ === nth) return i + 1; // 1-based
  }
  console.error(`[pushswap] ligne introuvable dans ${fn} : ${text}`);
  return s + 1;
}
const LAST_LINE = LINES.lastIndexOf("}") + 1; // accolade finale de meduim

// ---------- Simulation ----------
const frameOf = (parent, callLine, fn) => ({
  fn,
  up: [{ fn: parent.fn, line: callLine }, ...parent.up],
  d: parent.d + 1,
});

/**
 * Rejoue medium sur `values` (entiers distincts).
 * Retourne { n, sortedV, events, snaps, names, ok }.
 *  - events[k] : { l: ligne sur le point d'être exécutée, o: nb d'opérations déjà faites,
 *                  fr: pile d'appels, v: variables locales, ph: phase, m: repères, ix: indexé ?, sc: boucle de scan ? }
 *  - snaps[o]  : { a, b, c } = piles et compteurs après o opérations
 *  - names[o]  : nom de l'opération qui mène de snaps[o] à snaps[o+1]
 */
export function trace(values) {
  const n = values.length;
  const sortedV = [...values].sort((x, y) => x - y);
  const rank = new Map(sortedV.map((v, i) => [v, i]));
  let a = values.map((v) => rank.get(v)); // sommet de pile = a[0]
  let b = [];
  const counts = { pa: 0, pb: 0, ra: 0, rb: 0, rrb: 0 };
  const snaps = [{ a: Uint16Array.from(a), b: Uint16Array.from(b), c: { ...counts } }];
  const names = [];
  const events = [];
  let indexed = false;

  const op = (name) => {
    if (name === "pb") b.unshift(a.shift());
    else if (name === "pa") a.unshift(b.shift());
    else if (name === "ra") a.push(a.shift());
    else if (name === "rb") b.push(b.shift());
    else if (name === "rrb") b.unshift(b.pop());
    counts[name]++;
    names.push(name);
    snaps.push({ a: Uint16Array.from(a), b: Uint16Array.from(b), c: { ...counts } });
  };
  const ev = (line, fr, v, ph, m, sc) =>
    events.push({ l: line, o: names.length, fr, v, ph, m: m || null, ix: indexed, sc: !!sc });

  const PH_SETUP = { t: "setup" };
  const PH_LOOP = { t: "loop" };
  const PH_HIGHER = { t: "higher" };

  // ----- chunktob -----
  function chunktob(parent, callLine, borne, c, k) {
    const fr = frameOf(parent, callLine, "chunktob");
    const ph = { t: "chunk", c, k, min: borne.min, max: borne.max, size: borne.max - borne.min + 1 };
    let tmpa = null;
    let i = null;
    const E = (text, nth = 0) => {
      const m = tmpa !== null && a.length && a[0] === tmpa ? [{ s: "a", p: 0, label: "tmpa" }] : null;
      ev(L("chunktob", text, nth), fr, [tmpa, i, borne.min, borne.max], ph, m);
    };
    E("i = 0;");
    i = 0;
    for (;;) {
      E("while (i < borne -> max - borne -> min + 1)");
      if (!(i < borne.max - borne.min + 1)) break;
      E("tmpa = *a;");
      tmpa = a[0];
      E("if (tmpa -> index <= borne -> max)");
      if (tmpa <= borne.max) {
        E("if (tmpa -> index <= (borne -> min + borne -> max) / 2)");
        if (tmpa <= Math.floor((borne.min + borne.max) / 2)) {
          E("pb(a, b, bench);", 0);
          op("pb");
          E("rb(b, bench);");
          op("rb");
        } else {
          E("pb(a, b, bench);", 1);
          op("pb");
        }
        E("i++;");
        i++;
      } else {
        E("ra(a, bench);");
        op("ra");
      }
    }
  }

  // ----- chunk -----
  function chunk(parent, callLine) {
    const fr = frameOf(parent, callLine, "chunk");
    let i = null, j = null, k = null, nn = null;
    const borne = { state: null, min: null, max: null };
    const E = (text, nth = 0) =>
      ev(L("chunk", text, nth), fr, [i, j, k, nn, borne.state, borne.min, borne.max], PH_SETUP);

    E("borne = malloc(sizeof(t_borne));");
    borne.state = "alloc";
    E("n = ft_size(*a);");
    nn = a.length;
    E("j = 0;");
    j = 0;
    E("k = ft_sqrt(n) / 2;");
    k = Math.floor(Math.floor(Math.sqrt(nn)) / 2);
    E("if (k < 1)");
    if (k < 1) {
      E("k = 1;");
      k = 1;
    }
    E("i = n / k;");
    i = Math.floor(nn / k);
    E("ft_index(a);");
    indexed = true;
    for (;;) {
      E("while (j < k - 1)");
      if (!(j < k - 1)) break;
      E("borne -> min = (j * (i));", 0);
      borne.min = j * i;
      E("borne -> max = borne -> min + (i - 1);");
      borne.max = borne.min + (i - 1);
      E("chunktob(borne, a, b, bench);", 0);
      chunktob(fr, L("chunk", "chunktob(borne, a, b, bench);", 0), borne, j + 1, k);
      E("j++;");
      j++;
    }
    E("borne -> min = (j * (i));", 1);
    borne.min = j * i;
    E("borne -> max = n - 1;");
    borne.max = nn - 1;
    E("chunktob(borne, a, b, bench);", 1);
    chunktob(fr, L("chunk", "chunktob(borne, a, b, bench);", 1), borne, j + 1, k);
    E("free(borne);");
    borne.state = "freed";
  }

  // ----- higher -----
  function higher(parent, callLine) {
    const fr = frameOf(parent, callLine, "higher");
    let pos = null; // position de tmp dans b ; null = pas encore assigné
    let i = null, j = null, k = null;
    const E = (text, nth = 0, scan = false) => {
      const marks = [];
      if (pos !== null && pos < b.length) marks.push({ s: "b", p: pos, label: "tmp" });
      if (k !== null && k < b.length) marks.push({ s: "b", p: k, label: "k", outline: true });
      const tmpIdx = pos === null ? null : pos >= b.length ? -1 : b[pos];
      ev(L("higher", text, nth), fr, [tmpIdx, i, j, k], PH_HIGHER, marks, scan);
    };
    E("i = 0;");
    i = 0;
    E("j = 0;");
    j = 0;
    E("k = 0;");
    k = 0;
    E("tmp = a;");
    pos = 0;
    for (;;) {
      E("while (tmp)", 0, true);
      if (pos >= b.length) break;
      E("if (i < tmp -> index)", 0, true);
      if (i < b[pos]) {
        E("i = tmp -> index;");
        i = b[pos];
        E("k = j;");
        k = j;
      }
      E("tmp = tmp -> next;", 0, true);
      pos++;
      E("j++;", 0, true);
      j++;
    }
    E("return (k);");
    return k;
  }

  // ----- btoa -----
  function btoa(parent, callLine, max, target) {
    const fr = frameOf(parent, callLine, "btoa");
    let j = null;
    const size = b.length;
    const dir = max <= Math.floor(size / 2) ? "rb" : "rrb";
    const ph = { t: "btoa", target, max, size, dir };
    const E = (text, nth = 0) => ev(L("btoa", text, nth), fr, [j, max], ph);
    E("j = 0;");
    j = 0;
    E("if (max <= (ft_size(*b) / 2))");
    if (dir === "rb") {
      for (;;) {
        E("while (j < max)");
        if (!(j < max)) break;
        E("rb(b, bench);");
        op("rb");
        E("j++;", 0);
        j++;
      }
    } else {
      for (;;) {
        E("while (j < (ft_size(*b) - max))");
        if (!(j < size - max)) break;
        E("rrb(b, bench);");
        op("rrb");
        E("j++;", 1);
        j++;
      }
    }
  }

  // ----- meduim -----
  const root = { fn: "meduim", up: [], d: 0 };
  let i = null;
  const E = (text, ph = PH_SETUP, nth = 0) => ev(L("meduim", text, nth), root, [i], ph);

  E("i = 0;");
  i = 0;
  E("chunk(a, b, bench);");
  chunk(root, L("meduim", "chunk(a, b, bench);"));
  for (;;) {
    E("while (*b)", PH_LOOP);
    if (!b.length) break;
    E("i = higher(*b);", PH_LOOP);
    const k = higher(root, L("meduim", "i = higher(*b);"));
    i = k;
    const target = b[k];
    E("btoa(b, i, bench);", { t: "pick", target, pos: k });
    btoa(root, L("meduim", "btoa(b, i, bench);"), k, target);
    E("pa(a, b, bench);", { t: "pa", target });
    op("pa");
  }
  ev(LAST_LINE, root, [i], { t: "done" });

  // x = cette ligne exécute une opération (pb, ra…) : la lecture automatique la laisse plus longtemps à l'écran
  for (let q = 0; q + 1 < events.length; q++) events[q].x = events[q + 1].o > events[q].o;

  const ok = b.length === 0 && a.every((x, p) => x === p);
  return { n, sortedV, events, snaps, names, ok };
}
