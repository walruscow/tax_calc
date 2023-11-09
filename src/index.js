'use strict';

const tax_brackets_2023 = [
  {
    label: "🧑 👑",
    sub_label: "Single",
    deduction: 13850,
    buckets: [
      {rate: .10, upper_bound: 11000},
      {rate: .12, upper_bound: 44725},
      {rate: .22, upper_bound: 95375},
      {rate: .24, upper_bound: 182100},
      {rate: .32, upper_bound: 231250},
      {rate: .35, upper_bound: 578125},
      {rate: .37, upper_bound: Infinity},
    ],
  },
  {
    label: "🧑‍🤝‍🧑",
    sub_label: "Married jointly",
    deduction: 27700,
    buckets: [
      {rate: .10, upper_bound: 22000},
      {rate: .12, upper_bound: 89450},
      {rate: .22, upper_bound: 190750},
      {rate: .24, upper_bound: 364200},
      {rate: .32, upper_bound: 462500},
      {rate: .35, upper_bound: 693750},
      {rate: .37, upper_bound: Infinity},
    ],
  },
  {
    label: "🧑🧑",
    sub_label: "Married separately",
    deduction: 13850,
    buckets: [
      {rate: .10, upper_bound: 11000},
      {rate: .12, upper_bound: 44725},
      {rate: .22, upper_bound: 95375},
      {rate: .24, upper_bound: 182100},
      {rate: .32, upper_bound: 231250},
      {rate: .35, upper_bound: 346875},
      {rate: .37, upper_bound: Infinity},
    ],
  },
  {
    label: "🧑👶",
    sub_label: "Head of household",
    deduction: 20800,
    buckets: [
      {rate: .10, upper_bound: 15700},
      {rate: .12, upper_bound: 59850},
      {rate: .22, upper_bound: 95350},
      {rate: .24, upper_bound: 182100},
      {rate: .32, upper_bound: 231250},
      {rate: .35, upper_bound: 578100},
      {rate: .37, upper_bound: Infinity},
    ],
  },
];

const additional_taxes_2023 = [
  {
    label: "social security",
    buckets: [
      {rate: .062, upper_bound: 160200},
    ],
  },
  {
    label: "medicare",
    buckets: [
      {rate: 0.0145, upper_bound: 200000},
      {rate: 0.0235, upper_bound: Infinity},
    ],
  },
];

function BracketResult(props) {
  const r = props.result;
  return (
    <div class='bracket_result'>
      <div>
        <div>
          <h2 class='bracket_title'>{r.bracket.label}</h2>
          <span class='bracket_subtitle'>{r.bracket.sub_label}</span>
        </div>
        <div>
          <h2 class='owed_amount'>{formatMoney(r.total)}</h2>
          <span class='money_label'>Owed</span>
        </div>
        <div>
          <h2 class='available_amount'>{formatMoney(r.available)}</h2>
          <span class='money_label'>Available</span>
        </div>
      </div>
    </div>
  );
}

function formatMoney(m) {
  if (!m) {
    return `${m}`;
  }
  const lookup = [
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "k" },
  ];
  const bracket = lookup.find((i) => m >= i.value) || {value: 1, suffix: ""};
  const val = m / bracket.value;
  const digits_before = val.toFixed(0).match(/^\d*/)[0].length;
  const decimal_digits = Math.max(0, 3 - digits_before);
  return `${val.toFixed(decimal_digits)}${bracket.suffix}`;
}

class TaxApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bad_value: false,
      income: 0,
      brackets: [],
    };
  }

  render() {
    let bracket_content;
    if (this.state.bad_value) {
      bracket_content = <div id='bad_value'><span>Haha, ok</span></div>;
    } else {
      bracket_content = this.state.brackets.map((b) =>
        <BracketResult result={b} />
      );
    }

    const income_string = this.state.bad_value ? "invalid" : formatMoney(this.state.income);
    return (
      <div>
        <div class='income_input'>
          <label class='subtitle' for='income'>Income</label>
          <input type='text' id='income' name='income' onInput={(e)=>this.handleInput(e)} />
        </div>
        <div class='income_display'>
          <h2>💸 {income_string}</h2>
        </div>
        <div class='bracket_results'>
          {bracket_content}
        </div>
      </div>
    );
  }


  async handleInput(e) {
    let input_value = (e.target.value === '') ? '0' : e.target.value;
    const income = parseInt(input_value);
    if (isNaN(income) || income < 0 || income >= 1e9) {
      this.setState({
        bad_value: true,
        income: 0,
        brackets: [],
      });
      return;
    }

    function sum_buckets(remaining, buckets) {
      let summed = 0;
      buckets.forEach(function(b) {
        const amount_for_rate = Math.min(remaining, b.upper_bound);
        remaining -= amount_for_rate;
        summed += b.rate * amount_for_rate;
      });
      return summed;
    }

    const brackets = tax_brackets_2023.map(function (bracket) {
      let remaining = income - bracket.deduction;
      let summed = sum_buckets(income - bracket.deduction, bracket.buckets);
      additional_taxes_2023.forEach(function(t) {
        summed += sum_buckets(income, t.buckets);
      });

      return {
        bracket: bracket,
        total: summed,
        available: income - summed,
      };
    });
    this.setState({
      bad_value: false,
      income: income,
      brackets: brackets,
    });
  }
}

class AppRoot extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div id='app'>
        <h1>Income tax</h1>
        <TaxApp />
      </div>
    );
  }
}


const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(<AppRoot/>);
