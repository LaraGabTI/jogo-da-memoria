"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Carta = { id: number; parId: number; valor: string };

// icones
const VALORES_BASE = ["🐇", "🫖", "⏱️", "🎩", "🗝️", "🍰", "🌹", "🃏"];

// caminho do fundo
const BG_IMG = "/fundo.png";

// Fisher–Yates
function embaralhar<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function gerarBaralho(): Carta[] {
    let id = 0;
    return embaralhar(
        VALORES_BASE.flatMap((valor, indice) => [
            { id: id++, parId: indice, valor },
            { id: id++, parId: indice, valor },
        ])
    );
}

export default function TabuleiroMemoria() {
    // IMPORTANTE: inicia vazio p/ evitar hidratação com Math.random
    const [deck, setDeck] = useState<Carta[]>([]);
    const [viradas, setViradas] = useState<number[]>([]);
    const [combinadas, setCombinadas] = useState<Set<number>>(new Set());
    const [bloqueado, setBloqueado] = useState(false);

    const [pontuacao, setPontuacao] = useState(0);
    const [segundos, setSegundos] = useState(0);
    const [cronometroAtivo, setCronometroAtivo] = useState(false);

    // Gera o baralho SÓ no cliente
    useEffect(() => {
        setDeck(gerarBaralho());
    }, []);

    const fimDeJogo = deck.length > 0 && combinadas.size === deck.length;

    /* ---------- cronômetro ---------- */
    const iniciarCronometroSeNecessario = () => {
        if (
            !cronometroAtivo &&
            !fimDeJogo &&
            combinadas.size === 0 &&
            viradas.length === 0
        ) {
            setCronometroAtivo(true);
        }
    };
    useEffect(() => {
        if (!cronometroAtivo) return;
        const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
        return () => window.clearInterval(id);
    }, [cronometroAtivo]);
    useEffect(() => {
        if (fimDeJogo) setCronometroAtivo(false);
    }, [fimDeJogo]);

    /* ---------- lógica do jogo ---------- */
    const reiniciar = () => {
        setDeck(gerarBaralho());
        setViradas([]);
        setCombinadas(new Set());
        setBloqueado(false);
        setPontuacao(0);
        setSegundos(0);
        setCronometroAtivo(false);
    };

    const aoClicarNaCarta = (idx: number) => {
        iniciarCronometroSeNecessario();
        if (bloqueado || fimDeJogo) return;

        const carta = deck[idx];
        if (!carta) return; // proteção enquanto carrega
        if (combinadas.has(carta.id)) return;
        if (viradas.includes(idx)) return;

        const novasViradas = [...viradas, idx];
        setViradas(novasViradas);

        if (novasViradas.length === 2) {
            setBloqueado(true);
            const [i1, i2] = novasViradas;
            const c1 = deck[i1];
            const c2 = deck[i2];
            if (!c1 || !c2) return;

            if (c1.parId === c2.parId) {
                const novo = new Set(combinadas);
                novo.add(c1.id);
                novo.add(c2.id);
                setCombinadas(novo);
                setPontuacao((p) => p + 10);
                setViradas([]);
                setBloqueado(false);
            } else {
                setTimeout(() => {
                    setViradas([]);
                    setBloqueado(false);
                }, 1000);
            }
        }
    };

    const estaVirada = (idx: number) => {
        const carta = deck[idx];
        return !!carta && (viradas.includes(idx) || combinadas.has(carta.id));
    };

    const tempoFormatado = useMemo(() => {
        const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
        const ss = String(segundos % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }, [segundos]);

    /* ---------- tema/estilo ---------- */
    const corTitulo = "#312e81";
    const corPainel = "#3730a3";
    const CARD_SIZE = "calc((min(100vw, 100vh) - 200px) / 4)";

    return (
        <div
            className="relative h-screen w-screen overflow-hidden flex flex-col"
            style={{ ["--card" as any]: CARD_SIZE }}
        >
            {/* Fundo */}
            <Image
                src={BG_IMG}
                alt="Fundo Alice"
                fill
                priority
                className="object-cover -z-10"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-white/40" />

            {/* Header */}
            <header className="relative z-10 py-3">
                <div className="mx-auto max-w-[1000px] flex items-center justify-center gap-2 sm:gap-3">
                    <h1
                        className="text-sm sm:text-base md:text-lg font-extrabold tracking-wide"
                        style={{ color: corTitulo }}
                        title="Alice Memory"
                    >
                        ♔ Alice Memory
                    </h1>

                    <div className="rounded-lg border bg-white backdrop-blur px-2.5 py-1.5 shadow-sm flex items-center gap-2">
                        <span
                            className="text-[10px] sm:text-xs font-semibold"
                            style={{ color: corPainel }}
                        >
                            Pontuação
                        </span>
                        <span
                            className="text-base sm:text-lg md:text-xl font-extrabold tabular-nums"
                            style={{ color: corPainel }}
                        >
                            {pontuacao}
                        </span>
                    </div>

                    <div className="rounded-lg border bg-white backdrop-blur px-2.5 py-1.5 shadow-sm flex items-center gap-2">
                        <span
                            className="text-[10px] sm:text-xs font-semibold"
                            style={{ color: corPainel }}
                        >
                            Tempo
                        </span>
                        <span
                            className="text-base sm:text-lg md:text-xl font-extrabold tabular-nums"
                            style={{ color: corPainel }}
                        >
                            {tempoFormatado}
                        </span>
                    </div>

                    <button
                        onClick={reiniciar}
                        className="px-3 py-2 rounded-lg border bg-white shadow-sm hover:shadow hover:bg-gray-50 transition text-sm sm:text-base text-sky-700 cursor-pointer"
                        title="Reiniciar jogo"
                    >
                        Reiniciar
                    </button>
                </div>
            </header>

            {/* Tabuleiro */}
            <main className="relative z-10 flex-1 flex items-center justify-center">
                <div
                    className="grid gap-2 sm:gap-3"
                    style={{ gridTemplateColumns: "repeat(4, var(--card))" }}
                >
                    {(deck.length ? deck : Array.from({ length: 16 })).map(
                        (carta, idx) => {
                            const virada = deck.length ? estaVirada(idx) : false;
                            const ehPar = deck.length
                                ? combinadas.has((carta as Carta).id)
                                : false;

                            return (
                                <button
                                    key={deck.length ? (carta as Carta).id : idx}
                                    onClick={() => deck.length && aoClicarNaCarta(idx)}
                                    disabled={
                                        !deck.length ||
                                        bloqueado ||
                                        ehPar ||
                                        viradas.includes(idx) ||
                                        fimDeJogo
                                    }
                                    className="group [perspective:1000px] w-[var(--card)] h-[var(--card)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={
                                        virada ? `Carta ${(carta as Carta)?.valor}` : "Carta virada"
                                    }
                                    title={virada ? (carta as Carta)?.valor : "Carta fechada"}
                                >
                                    <div
                                        className={[
                                            "relative h-full w-full rounded-xl border-4 border-neutral-800 shadow-[0_4px_0_rgba(0,0,0,0.15)]",
                                            "transition-transform duration-500 [transform-style:preserve-3d]",
                                            virada ? "[transform:rotateY(180deg)]" : "",
                                            ehPar ? "ring-4 ring-pink-300" : "",
                                        ].join(" ")}
                                    >
                                        {/* Verso */}
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-sky-100/80 text-sky-700 text-3xl [backface-visibility:hidden]">
                                            <span>🔒</span>
                                        </div>

                                        {/* Frente */}
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 text-4xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
                                            <span>{deck.length ? (carta as Carta).valor : ""}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        }
                    )}
                </div>
            </main>

            {/* Rodapé central */}
            <footer className="relative z-10 py-3">
                <div className="mx-auto max-w-[1000px] flex items-center justify-center gap-4">
                    <p className="text-sm font-medium" style={{ color: corTitulo }}>
                        {fimDeJogo
                            ? "🎉 Maravilhoso! Encontraste todos os pares!"
                            : "Vire duas cartas para encontrar os pares."}
                    </p>
                    {fimDeJogo && (
                        <button
                            onClick={reiniciar}
                            className="rounded-lg border bg-white px-2.5 py-1.5 shadow-sm transition text-sky-700 flex items-center gap-2 hover:shadow hover:bg-gray-50 cursor-pointer"
                        >
                            Jogar novamente
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}
