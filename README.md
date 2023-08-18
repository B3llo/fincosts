# FinCosts 🌩️

**FinCosts** is a powerful CLI tool designed to optimize cloud costs. By identifying unused resources across various cloud platforms, it provides actionable insights and recommendations to save costs.

## Features

- **Deep Analysis**: Identify unused resources in your cloud infrastructure.
- **Multi-cloud Support**: Works across AWS, GCP, and Azure.
- **Automated Recommendations**: Get insights and actionable recommendations.
- **Ease of Use**: User-friendly CLI interface.

## :zap:Advantages

- **Cost Savings**: Reduce your cloud expenses by identifying and removing unused resources.
- **Efficiency**: Optimize both cost and performance of your cloud setup.

## 💡Example

After setting up `fincosts`, you can easily run an analysis on your cloud setup:

```bash
$ fincosts analyze --provider=aws
👉  You selected AWS
👉  Using AWS credential profile default
🧪 Starting analysis...
📊 Identified 5 unused EC2 instances.
📊 Identified 2 unused EBS volumes.
...
💰 Potential savings: $150/month
```

## 📥 Installation

```bash
git clone https://github.com/B3llo/fincosts.git
cd fincosts
npm install
npm link
```

<hr>

####License: [MIT](LICENSE)
