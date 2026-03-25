export interface Story {
  category: string
  headline: string
  byline: string
  excerpt: string
}

export interface Brief {
  time: string
  text: string
}

export const stories: Story[] = [
  {
    category: 'ARTIFICIAL INTELLIGENCE',
    headline: 'Autonomous Agents Now Outpace Human Analysts in Market Surveillance',
    byline: 'By Our Technology Correspondent',
    excerpt:
      'A landmark study confirms AI agents process and synthesize global market signals at a rate 400 times faster than their human counterparts, raising questions about the future of financial news.',
  },
  {
    category: 'DATA POLICY',
    headline: 'Nations Convene Emergency Summit on Personalized Information Rights',
    byline: 'Staff Reporter',
    excerpt:
      'Delegates from 48 countries gathered in Geneva to draft the first international accord governing individually curated news feeds and algorithmic editorial control.',
  },
  {
    category: 'MEDIA & SOCIETY',
    headline: 'Curated Knowledge Diets Shown to Improve Reader Retention by 62%',
    byline: 'By Our Science Desk',
    excerpt:
      'Researchers at MIT publish findings suggesting that AI-personalized briefings lead to significantly higher comprehension and recall compared to traditional broadcast formats.',
  },
  {
    category: 'TECHNOLOGY',
    headline: '"Morning Brief" Model Achieves Sub-Minute Synthesis Across 200 Sources',
    byline: 'By Our Digital Affairs Editor',
    excerpt:
      'The latest generation of news distillation engines can now summarize overnight global developments into a single coherent digest in under sixty seconds.',
  },
]

export const briefs: Brief[] = [
  { time: '06:14 EDT', text: 'Tech index closes at record high amid AI optimism' },
  { time: '05:47 EDT', text: 'New encryption standards adopted by leading data brokers' },
  { time: '04:30 EDT', text: 'Central banks signal continued caution on digital assets' },
  { time: '03:11 EDT', text: 'Satellite imagery reveals accelerating Arctic ice melt' },
]

export const benefitsList = [
  'AI-curated briefings from 1,000+ global sources',
  'Delivered to your inbox before your morning coffee',
  'Adapts to your interests over time',
]

export const sectionNav = ['Technology', 'Markets', 'Policy', 'Science', 'Society', 'World', 'Opinion']
