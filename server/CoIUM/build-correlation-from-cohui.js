/**
 * Build correlation recommendations from Java CoHUI output
 * Replaces Python analyze_correlation_results.py
 *
 * Reads cohui_output.json (Java CoHUI algorithm stdout),
 * builds a product-to-product recommendation map using KULC * utility scores,
 * falls back to co-occurrence analysis when CoHUI coverage is low,
 * and writes correlation_recommendations.json.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const COHUI_OUTPUT_PATH = path.join(__dirname, 'cohui_output.json');
const TRANSACTION_PATH  = path.join(__dirname, 'fashion_store.dat');
const OUTPUT_PATH       = path.join(__dirname, 'correlation_recommendations.json');

const MAX_RECOMMENDATIONS = 10;
const MIN_COHUI_COVERAGE  = 20; // minimum unique source items before fallback kicks in

// ---------------------------------------------------------------------------
// 1. Read Java CoHUI output
// ---------------------------------------------------------------------------
function readCoHUIOutput() {
    if (!fs.existsSync(COHUI_OUTPUT_PATH)) {
        console.log(`[WARN] CoHUI output not found at ${COHUI_OUTPUT_PATH}`);
        return null;
    }

    const raw = fs.readFileSync(COHUI_OUTPUT_PATH, 'utf8');
    const data = JSON.parse(raw);

    console.log('='.repeat(80));
    console.log('BUILD CORRELATION RECOMMENDATIONS FROM CoHUI');
    console.log('='.repeat(80));
    console.log();
    console.log(`CoHUI output loaded:`);
    console.log(`  - Runtime     : ${data.runtime_ms} ms`);
    console.log(`  - Memory      : ${data.memory_mb} MB`);
    console.log(`  - CoHUI count : ${data.cohui_count}`);
    console.log(`  - Itemsets    : ${data.cohuis ? data.cohuis.length : 0}`);
    console.log();

    return data;
}

// ---------------------------------------------------------------------------
// 2. Build recommendation scores from CoHUI itemsets
// ---------------------------------------------------------------------------
function buildScoresFromCoHUI(cohuis) {
    // scores[sourceItem][recItem] = aggregated score
    const scores = {};

    for (const cohui of cohuis) {
        const { items, utility, kulc } = cohui;
        const score = kulc * utility;

        for (let i = 0; i < items.length; i++) {
            const source = items[i];
            if (!scores[source]) scores[source] = {};

            for (let j = 0; j < items.length; j++) {
                if (i === j) continue;
                const target = items[j];
                scores[source][target] = (scores[source][target] || 0) + score;
            }
        }
    }

    const uniqueSources = Object.keys(scores).length;
    console.log(`CoHUI score map built: ${uniqueSources} unique source items`);

    return scores;
}

// ---------------------------------------------------------------------------
// 3. Co-occurrence fallback
// ---------------------------------------------------------------------------
function buildCoOccurrence() {
    if (!fs.existsSync(TRANSACTION_PATH)) {
        console.log(`[WARN] Transaction file not found at ${TRANSACTION_PATH}`);
        return {};
    }

    console.log('Building co-occurrence fallback from transactions...');

    const raw = fs.readFileSync(TRANSACTION_PATH, 'utf8');
    const lines = raw.split('\n').filter(line => line.trim().length > 0);

    // coOccurrence[a][b] = number of transactions containing both a and b
    const coOccurrence = {};

    for (const line of lines) {
        const items = line.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));

        for (let i = 0; i < items.length; i++) {
            const a = items[i];
            if (!coOccurrence[a]) coOccurrence[a] = {};

            for (let j = i + 1; j < items.length; j++) {
                const b = items[j];
                if (!coOccurrence[b]) coOccurrence[b] = {};

                coOccurrence[a][b] = (coOccurrence[a][b] || 0) + 1;
                coOccurrence[b][a] = (coOccurrence[b][a] || 0) + 1;
            }
        }
    }

    const uniqueItems = Object.keys(coOccurrence).length;
    console.log(`  - Transactions : ${lines.length}`);
    console.log(`  - Unique items : ${uniqueItems}`);

    return coOccurrence;
}

// ---------------------------------------------------------------------------
// 4. Merge scores into final recommendation map
// ---------------------------------------------------------------------------
function buildRecommendationMap(cohuiScores, coOccurrence) {
    const recommendations = {};

    // --- CoHUI-based recommendations ---
    for (const [source, targets] of Object.entries(cohuiScores)) {
        const sorted = Object.entries(targets)
            .sort((a, b) => b[1] - a[1])
            .slice(0, MAX_RECOMMENDATIONS)
            .map(([itemId]) => Number(itemId));

        recommendations[source] = sorted;
    }

    const cohuiCoverage = Object.keys(recommendations).length;
    console.log(`\nCoHUI coverage: ${cohuiCoverage} items with recommendations`);

    // --- Co-occurrence fallback when coverage is low ---
    if (cohuiCoverage < MIN_COHUI_COVERAGE && Object.keys(coOccurrence).length > 0) {
        console.log(`Coverage below threshold (${MIN_COHUI_COVERAGE}), supplementing with co-occurrence...`);

        let supplemented = 0;

        for (const [source, targets] of Object.entries(coOccurrence)) {
            if (recommendations[source]) continue; // already covered by CoHUI

            const sorted = Object.entries(targets)
                .sort((a, b) => b[1] - a[1])
                .slice(0, MAX_RECOMMENDATIONS)
                .map(([itemId]) => Number(itemId));

            if (sorted.length > 0) {
                recommendations[source] = sorted;
                supplemented++;
            }
        }

        console.log(`  - Supplemented ${supplemented} items from co-occurrence`);
    }

    return recommendations;
}

// ---------------------------------------------------------------------------
// 5. Write output
// ---------------------------------------------------------------------------
function writeOutput(recommendations) {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(recommendations, null, 2), 'utf8');

    const totalItems = Object.keys(recommendations).length;
    const totalRecs = Object.values(recommendations).reduce((sum, arr) => sum + arr.length, 0);
    const avgRecs = totalItems > 0 ? (totalRecs / totalItems).toFixed(1) : 0;

    console.log();
    console.log('='.repeat(80));
    console.log('OUTPUT WRITTEN');
    console.log('='.repeat(80));
    console.log(`  File             : ${OUTPUT_PATH}`);
    console.log(`  Products covered : ${totalItems}`);
    console.log(`  Total recs       : ${totalRecs}`);
    console.log(`  Avg recs/product : ${avgRecs}`);
    console.log();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function buildCorrelationsFromCoHUI() {
    const data = readCoHUIOutput();

    let cohuiScores = {};
    if (data && data.cohuis && data.cohuis.length > 0) {
        cohuiScores = buildScoresFromCoHUI(data.cohuis);
    } else {
        console.log('[INFO] No CoHUI itemsets available, will use co-occurrence only');
    }

    // Always prepare co-occurrence so it is ready for fallback
    const coOccurrence = buildCoOccurrence();

    // If CoHUI produced nothing at all, force fallback regardless of threshold
    const effectiveScores = Object.keys(cohuiScores).length > 0 ? cohuiScores : {};
    const recommendations = buildRecommendationMap(effectiveScores, coOccurrence);

    if (Object.keys(recommendations).length === 0) {
        console.log('[WARN] No recommendations generated. Check input files.');
        return;
    }

    writeOutput(recommendations);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
buildCorrelationsFromCoHUI();
