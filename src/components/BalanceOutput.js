import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  // YOUR CODE GOES HERE
  const { journalEntries, accounts, userInput } = state;

  if (!userInput.format || !journalEntries || journalEntries.length === 0 || !accounts || accounts.length === 0) {
    return {
      balance: [],
      totalCredit: 0,
      totalDebit: 0,
      userInput
    };
  }

  let filteredAccounts = accounts;
  if (userInput.startAccount && userInput.startAccount !== '*') {
    filteredAccounts = accounts.filter(account => account.ACCOUNT >= userInput.startAccount);
  }
  if (userInput.endAccount && userInput.endAccount !== '*') {
    filteredAccounts = filteredAccounts.filter(account => account.ACCOUNT <= userInput.endAccount);
  }

  let filteredJournal = journalEntries;
  if (userInput.startPeriod && !isNaN(userInput.startPeriod.valueOf())) {
    filteredJournal = journalEntries.filter(entry => entry.PERIOD >= userInput.startPeriod);
  }
  if (userInput.endPeriod && !isNaN(userInput.endPeriod.valueOf())) {
    filteredJournal = filteredJournal.filter(entry => entry.PERIOD <= userInput.endPeriod);
  }

  const accountBalances = {};

  filteredAccounts.forEach(account => {
    accountBalances[account.ACCOUNT] = {
      ACCOUNT: account.ACCOUNT,
      DESCRIPTION: account.LABEL,
      DEBIT: 0,
      CREDIT: 0,
      BALANCE: 0
    };
  });

  filteredJournal.forEach(entry => {
    if (accountBalances[entry.ACCOUNT]) {
      accountBalances[entry.ACCOUNT].DEBIT += entry.DEBIT;
      accountBalances[entry.ACCOUNT].CREDIT += entry.CREDIT;
      accountBalances[entry.ACCOUNT].BALANCE = accountBalances[entry.ACCOUNT].DEBIT - accountBalances[entry.ACCOUNT].CREDIT;
    }
  });

  balance = Object.values(accountBalances).sort((a, b) => a.ACCOUNT - b.ACCOUNT);

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
