const _ = require('lodash');
const cliCursor = require('cli-cursor');
const runAsync = require('run-async');
const {
  flatMap, map, take, takeUntil,
} = require('rxjs/operators');

const Base = require('inquirer/lib/prompts/base');
const observe = require('inquirer/lib/utils/events');

class StaticSelectPrompt extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    if (!this.opt.choices) {
      this.throwParamError('choices');
    }

    this.selected = 0;

    const initialValue = this.opt.default;
    if (initialValue) {
      const index = _.findIndex(
        this.opt.choices.realChoices,
        ({ value }) => value === initialValue
      );
      this.selected = Math.max(index, 0);
    }

    this.opt.default = null;
  }

  _run(cb) {
    this.done = cb;
    const self = this;

    const events = observe(this.rl);
    events.normalizedUpKey.pipe(takeUntil(events.line))
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey.pipe(takeUntil(events.line))
      .forEach(this.onDownKey.bind(this));
    events.line.pipe(
      take(1),
      map(this.getCurrentValue.bind(this)),
      flatMap(value => runAsync(self.opt.filter)(value).catch(err => err))
    )
      .forEach(this.onSubmit.bind(this));

    cliCursor.hide();
    this.render();
    return this;
  }

  render() {
    let message = '';

    message += this.getQuestion();
    message += this.opt.choices.getChoice(this.selected).short;

    this.screen.render(message);
  }

  onSubmit(value) {
    this.status = 'answered';
    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(value);
  }

  getCurrentValue() {
    return this.opt.choices.getChoice(this.selected).value;
  }

  onUpKey() {
    this.selected = this.selected > 0 ? this.selected - 1 : this.selected;
    this.render();
  }

  onDownKey() {
    this.selected = this.selected < this.opt.choices.realLength - 1
      ? this.selected + 1
      : this.selected;
    this.render();
  }
}

module.exports = StaticSelectPrompt;
