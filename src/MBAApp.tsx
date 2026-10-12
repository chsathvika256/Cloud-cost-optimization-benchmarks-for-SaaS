import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Award, BarChart3, BookOpenCheck, Building2, ChevronRight, CircleDollarSign, Globe2, Lightbulb, Scale, ShieldCheck, Target, TrendingDown, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { initialCompanies, type CompanyCase } from './data'
import './mba.css'
import './mba-responsive.css'

type Scope = 'Combined' | 'Hyderabad' | 'Global'
type Measure = 'Average' | 'Median'

interface StrategyProfile {
  strategy: string
  shortName: string
  cases: CompanyCase[]
  averageSavings: number
  medianSavings: number
  averagePerformance: number | null
  evidenceStrength: 'High' | 'Moderate' | 'Limited'
  bestFor: string
  managementImplication: string
}

const familyByCompany: Record<string, string> = {
  darwinbox: 'Hardware & Custom Silicon',
  fyle: 'Serverless & Event-Driven',
  ozonetel: 'Spot & Elastic Capacity',
  keka: 'Spot & Elastic Capacity',
  highradius: 'Storage Lifecycle Management',
  canva: 'FinOps & Portfolio Governance',
  godaddy: 'Serverless & Event-Driven',
  forethought: 'Serverless & Event-Driven',
  bynder: 'Storage Lifecycle Management',
  'ge-vernova': 'FinOps & Portfolio Governance',
  panoculon: 'Architecture Redesign',
  healthcare: 'Serverless & Event-Driven',
  'eks-audit': 'Rightsizing & Resource Controls',
  pinterest: 'Rightsizing & Resource Controls',
  'prime-video': 'Architecture Redesign',
  baselime: 'Architecture Redesign',
  netflix: 'Managed Cloud Services',
  doordash: 'Rightsizing & Resource Controls',
  airbyte: 'Spot & Elastic Capacity',
  segment: 'Storage Lifecycle Management',
}

const strategyDetails: Record<string, { shortName: string; bestFor: string; implication: string }> = {
  'Serverless & Event-Driven': { shortName: 'Serverless', bestFor: 'Variable or time-bound workloads', implication: 'Strong savings with low idle cost; assess vendor dependence and execution limits.' },
  'Architecture Redesign': { shortName: 'Architecture redesign', bestFor: 'High-volume services with structural cost problems', implication: 'Largest transformation potential, but requires greater engineering investment and change management.' },
  'Storage Lifecycle Management': { shortName: 'Storage lifecycle', bestFor: 'Data-intensive SaaS with retention obligations', implication: 'A relatively low-disruption lever when access patterns and compliance rules are understood.' },
  'Spot & Elastic Capacity': { shortName: 'Spot & elasticity', bestFor: 'Interruptible and sharply variable demand', implication: 'Attractive for flexible workloads; continuity controls and retry mechanisms are essential.' },
  'Rightsizing & Resource Controls': { shortName: 'Rightsizing', bestFor: 'Mature Kubernetes and shared compute estates', implication: 'Creates recurring efficiency through measurement, allocation discipline and automated scaling.' },
  'Hardware & Custom Silicon': { shortName: 'Custom silicon', bestFor: 'High-volume AI inference or repeatable compute', implication: 'Can produce exceptional unit economics when workload compatibility and migration skills exist.' },
  'FinOps & Portfolio Governance': { shortName: 'FinOps governance', bestFor: 'Large, fragmented cloud portfolios', implication: 'Combines technical savings with accountability; value increases with organizational scale.' },
  'Managed Cloud Services': { shortName: 'Managed services', bestFor: 'Teams carrying high operational overhead', implication: 'Trades some platform control for lower maintenance burden and more predictable scaling.' },
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function buildProfiles(cases: CompanyCase[]): StrategyProfile[] {
  const grouped = cases.reduce<Record<string, CompanyCase[]>>((result, company) => {
    const family = familyByCompany[company.id] ?? 'Other'
    result[family] ??= []
    result[family].push(company)
    return result
  }, {})

  return Object.entries(grouped).map(([strategy, strategyCases]) => {
    const savings = strategyCases.map((company) => company.savingsPercent)
    const performance = strategyCases.map((company) => company.performancePercent).filter((value): value is number => value !== undefined && value > 0)
    const sourcedCases = strategyCases.filter((company) => company.evidence === 'Source-backed').length
    const details = strategyDetails[strategy] ?? { shortName: strategy, bestFor: 'Case-specific use', implication: 'Requires additional evidence.' }
    const evidenceStrength = strategyCases.length >= 3 && sourcedCases >= 2 ? 'High' : strategyCases.length >= 2 ? 'Moderate' : 'Limited'
    return {
      strategy,
      shortName: details.shortName,
      cases: strategyCases,
      averageSavings: savings.reduce((sum, value) => sum + value, 0) / savings.length,
      medianSavings: median(savings),
      averagePerformance: performance.length ? performance.reduce((sum, value) => sum + value, 0) / performance.length : null,
      evidenceStrength,
      bestFor: details.bestFor,
      managementImplication: details.implication,
    }
  })
}

function MBAApp() {
  const [scope, setScope] = useState<Scope>('Combined')
  const [measure, setMeasure] = useState<Measure>('Average')
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'MBA Strategy Analysis | SaaS Cloud Cost Optimization'
    return () => { document.title = previousTitle }
  }, [])
  const cases = useMemo(() => {
    const saved = localStorage.getItem('cloud-cost-research-v1')
    try { return saved ? JSON.parse(saved) as CompanyCase[] : initialCompanies } catch { return initialCompanies }
  }, [])
  const selectedCases = cases.filter((company) => scope === 'Combined' || company.region === scope)
  const profiles = buildProfiles(selectedCases).sort((a, b) => (measure === 'Average' ? b.averageSavings - a.averageSavings : b.medianSavings - a.medianSavings))
  const winner = profiles[0]
  const reportedPerformanceCases = selectedCases.filter((company) => company.performancePercent && company.performancePercent > 0)
  const sourceBackedCases = selectedCases.filter((company) => company.evidence === 'Source-backed').length
  const regionalLeaders = (['Hyderabad', 'Global'] as const).map((region) => {
    const regionProfiles = buildProfiles(cases.filter((company) => company.region === region)).sort((a, b) => b.averageSavings - a.averageSavings)
    return { region, winner: regionProfiles[0]?.shortName ?? 'Not available', savings: regionProfiles[0]?.averageSavings ?? 0 }
  })
  const chartData = profiles.map((profile) => ({ name: profile.shortName, value: Number((measure === 'Average' ? profile.averageSavings : profile.medianSavings).toFixed(1)), evidence: profile.evidenceStrength }))

  return <div className="mba-root">
    <header className="mba-header">
      <div className="mba-brand"><span><BarChart3 size={19} /></span><div><strong>Cloud Strategy Research</strong><small>MBA decision analytics</small></div></div>
      <a href="/" className="mba-back"><ArrowLeft size={15} /> Original analytics dashboard</a>
    </header>

    <main className="mba-main">
      <section className="mba-title-block">
        <p className="mba-kicker">MBA RESEARCH PROJECT · CLOUD COST MANAGEMENT</p>
        <h1>A Data-Driven Study on Cloud Cost Optimization Strategies for SaaS Companies</h1>
        <div className="mba-question"><Target size={22} /><div><span>Central research question</span><strong>Which cloud cost optimization strategy produces the best business outcome for SaaS companies?</strong></div></div>
      </section>

      <section className="mba-toolbar">
        <div><span>Analysis group</span><div className="mba-segments">{(['Combined', 'Hyderabad', 'Global'] as Scope[]).map((item) => <button className={scope === item ? 'active' : ''} onClick={() => setScope(item)} key={item}>{item}</button>)}</div></div>
        <div><span>Ranking method</span><div className="mba-segments">{(['Average', 'Median'] as Measure[]).map((item) => <button className={measure === item ? 'active' : ''} onClick={() => setMeasure(item)} key={item}>{item} savings</button>)}</div></div>
        <p>{selectedCases.length} company cases · {profiles.length} strategy families</p>
      </section>

      <section className="mba-answer">
        <div className="mba-answer-label"><Award size={18} /> Research finding</div>
        <div className="mba-answer-copy">
          <p>Best-performing strategy in the selected sample</p>
          <h2>{winner?.strategy ?? 'No comparable strategy'}</h2>
          <p><strong>{(measure === 'Average' ? winner?.averageSavings : winner?.medianSavings)?.toFixed(1)}% {measure.toLowerCase()} reported savings</strong> across {winner?.cases.length ?? 0} case{winner?.cases.length === 1 ? '' : 's'}. {winner?.managementImplication}</p>
        </div>
        <div className="mba-answer-caveat"><Scale size={20} /><p><strong>Interpret with context</strong>This is the best observed financial result, not a universal prescription. Workload fit, implementation risk and evidence strength must guide the final decision.</p></div>
      </section>

      <section className="mba-stat-grid">
        <article><CircleDollarSign size={20} /><span>Leading reported saving</span><strong>{(measure === 'Average' ? winner?.averageSavings : winner?.medianSavings)?.toFixed(1)}%</strong><small>{measure} within selected scope</small></article>
        <article><Users size={20} /><span>Case-study sample</span><strong>{selectedCases.length}</strong><small>{scope} SaaS companies</small></article>
        <article><BookOpenCheck size={20} /><span>Source-backed records</span><strong>{sourceBackedCases}</strong><small>{Math.round(sourceBackedCases / selectedCases.length * 100)}% of selected cases</small></article>
        <article><TrendingDown size={20} /><span>Performance evidence</span><strong>{reportedPerformanceCases.length}</strong><small>Cases report a quantified gain</small></article>
      </section>

      <section className="mba-analysis-grid">
        <article className="mba-panel mba-ranking-chart">
          <div className="mba-panel-head"><div><span>01 · FINANCIAL OUTCOME</span><h2>Strategy savings comparison</h2></div><small>{measure} reported reduction (%)</small></div>
          <ResponsiveContainer width="100%" height={360}><BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dedbd2" /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={132} tick={{ fontSize: 11, fill: '#283530' }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, `${measure} savings`]} /><Bar dataKey="value" radius={[0, 3, 3, 0]}>{chartData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#b6492d' : '#1e6b60'} />)}</Bar></BarChart></ResponsiveContainer>
          <p className="mba-chart-note">Ranking uses reported percentage reductions so companies of different sizes remain comparable. Dollar savings are excluded because baseline spend is unavailable for most cases.</p>
        </article>

        <article className="mba-panel mba-region-card">
          <div className="mba-panel-head"><div><span>02 · REGIONAL VIEW</span><h2>Different leaders by market</h2></div><Globe2 size={19} /></div>
          {regionalLeaders.map((item) => <div className="mba-region-result" key={item.region}><div><span>{item.region}</span><strong>{item.winner}</strong></div><b>{item.savings.toFixed(1)}%</b></div>)}
          <div className="mba-interpretation"><Lightbulb size={18} /><p>Hyderabad results emphasize targeted compute and serverless interventions. Global cases show broader use of architecture redesign, governance and platform migration.</p></div>
        </article>

        <article className="mba-panel mba-matrix">
          <div className="mba-panel-head"><div><span>03 · DECISION MATRIX</span><h2>Compare strategy evidence and business fit</h2></div><small>Ranked by {measure.toLowerCase()} savings</small></div>
          <div className="mba-table-wrap"><table><thead><tr><th>Rank</th><th>Strategy family</th><th>Reported saving</th><th>Cases</th><th>Performance impact</th><th>Evidence</th><th>Best suited for</th></tr></thead><tbody>{profiles.map((profile, index) => <tr key={profile.strategy}><td>{index + 1}</td><td><strong>{profile.strategy}</strong></td><td><b>{(measure === 'Average' ? profile.averageSavings : profile.medianSavings).toFixed(1)}%</b></td><td>{profile.cases.length}</td><td>{profile.averagePerformance === null ? 'Not quantified' : `${profile.averagePerformance.toFixed(1)}% avg.`}</td><td><span className={`mba-evidence ${profile.evidenceStrength.toLowerCase()}`}>{profile.evidenceStrength}</span></td><td>{profile.bestFor}</td></tr>)}</tbody></table></div>
        </article>
      </section>

      <section className="mba-decision-section">
        <div className="mba-section-heading"><span>MANAGERIAL RECOMMENDATIONS</span><h2>The best strategy depends on the business situation</h2><p>Use the financial ranking as a starting point, then select according to workload economics and organizational capability.</p></div>
        <div className="mba-recommendations">
          <article><span><Building2 size={18} /> For early-stage SaaS</span><h3>Serverless & Event-Driven</h3><p>Reduces idle infrastructure and operating effort when demand is uncertain or concentrated in short periods.</p><b>Priority: cash efficiency</b></article>
          <article><span><BarChart3 size={18} /> For scaling SaaS</span><h3>Rightsizing & Elastic Capacity</h3><p>Aligns resources with actual demand while preserving responsiveness during growth and seasonal peaks.</p><b>Priority: unit economics</b></article>
          <article><span><ShieldCheck size={18} /> For enterprise SaaS</span><h3>FinOps & Portfolio Governance</h3><p>Creates accountability across teams and coordinates commitments, lifecycle policies and modernization.</p><b>Priority: control at scale</b></article>
        </div>
      </section>

      <section className="mba-methodology">
        <div><span>RESEARCH METHOD</span><h2>How to read these findings</h2></div>
        <ol>
          <li><b>Sample</b><p>{cases.length} purposively selected SaaS case studies: {cases.filter((item) => item.region === 'Hyderabad').length} Hyderabad and {cases.filter((item) => item.region === 'Global').length} global cases.</p></li>
          <li><b>Primary measure</b><p>Reported percentage cost reduction, summarized by mean or median. Absolute savings are not mixed into this ranking.</p></li>
          <li><b>Unit of analysis</b><p>Each company is assigned to the strategy family most central to its reported intervention.</p></li>
          <li><b>Evidence caution</b><p>Case-study claims are observational, use different baselines and are not audited financial results. Association does not prove causation.</p></li>
        </ol>
      </section>
    </main>
    <footer className="mba-footer"><span>MBA Research Dashboard · Cloud Cost Optimization for SaaS</span><a href="/"><span>Open original technical dashboard</span><ChevronRight size={14} /></a></footer>
  </div>
}

export default MBAApp