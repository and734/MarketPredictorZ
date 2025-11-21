import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { ticker, userId } = await request.json();

    if (!ticker || !userId) {
      return NextResponse.json(
        { error: 'Ticker and userId are required' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Search for recent data about the ticker
    const searchQuery = `${ticker} stock price news analysis recent performance`;
    const searchResult = await zai.functions.invoke("web_search", {
      query: searchQuery,
      num: 10
    });

    // Create system instruction for financial analysis
    const systemInstruction = `Sei un analista finanziario esperto, obiettivo e conciso. Il tuo compito è generare un'analisi basata sui dati recenti trovati tramite la ricerca Google. Fornisci un'analisi concisa e bilanciata della risorsa richiesta e una breve previsione sul suo andamento a breve termine (riassunta in una singola frase). Utilizza solo informazioni recenti e verificabili. Il tuo output deve essere formattato in Markdown e includere due sezioni principali: 1. Analisi e Panoramica (Analysis and Overview) e 2. Previsione a Breve Termine (Short-Term Prediction).`;

    // Create messages for AI completion
    const messages = [
      {
        role: 'system',
        content: systemInstruction
      },
      {
        role: 'user',
        content: `Analizza il seguente ticker: ${ticker}. Dati di ricerca recenti: ${JSON.stringify(searchResult.slice(0, 5))}`
      }
    ];

    // Get AI analysis
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const analysis = completion.choices[0]?.message?.content;
    
    if (!analysis) {
      throw new Error('Failed to generate analysis');
    }

    // Save to database
    const marketAnalysis = await db.marketAnalysis.create({
      data: {
        ticker: ticker.toUpperCase(),
        analysis,
        sources: JSON.stringify(searchResult),
        userId
      }
    });

    return NextResponse.json({
      id: marketAnalysis.id,
      ticker: marketAnalysis.ticker,
      analysis: marketAnalysis.analysis,
      sources: searchResult,
      createdAt: marketAnalysis.createdAt
    });

  } catch (error) {
    console.error('Market analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const analyses = await db.marketAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(analyses.map(analysis => ({
      id: analysis.id,
      ticker: analysis.ticker,
      analysis: analysis.analysis,
      createdAt: analysis.createdAt
    })));

  } catch (error) {
    console.error('Get analyses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}