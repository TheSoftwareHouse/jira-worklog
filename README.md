# Jira Worklog

Simple CLI tool for logging work in Jira.

- Finds tasks basing on **Jira** (column "In progress") and **Git** activity (in current directory)
- Suggests a number of hours to log (considering current worklogs)
- Works within single project

## Usage

```
$ worklog
? Choose date (use arrows): 2018-11-09 (Friday)
? Choose task: (Use arrow keys)
  Git
❯ JRA-123 - First task
  Jira
  JRA-234 - Second task
  
[ENTER]
  
$ worklog
? Choose date (use arrows): 2018-11-09 (Friday)
? Choose task: JRA-123 - First task
? Choose time spent: (Use arrow keys)
❯ 4h
  3h
  2h
  1h
  
[ENTER]
  
$ worklog
? Choose date (use arrows): 2018-11-09 (Friday)
? Choose task: JRA-123 - First task
? Choose time spent: 4h
? Do you confirm to log 4h of work in task JRA-123? (Y/n)
  
[ENTER]
  
$ worklog
? Choose date (use arrows): 2018-11-09 (Friday)
? Choose task: JRA-123 - First task
? Choose time spent: 4h
? Do you confirm to log 4h of work in task JRA-123? Yes
info:    Successfully logged 4h of work.
```

## Install

```
npm i @tshio/jira-worklog -g
```

## Configuration

Initially, `worklog` will ask for following data:
```
? Set project key (like "JRA") JRA
? Set base URL (like "jira.atlassian.net") jira.atlassian.net
? Jira login john.doe
? Jira password [hidden]
```
*Note: passwords are stored in Keychain.*

### Logout

To clear credentials and all other settings, use flag `--reset` like:
```
worklog --reset
```

# License

MIT
