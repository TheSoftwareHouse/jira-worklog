# Jira Worklog
Simple CLI tool for logging work in Jira

## Example

```
$ worklog yesterday
? Choose task (from 2018-10-07): (Use arrow keys)
❯ JRA-123 - First task
  JRA-234 - Second task
  
[ENTER]

$ worklog yesterday
? Choose task (from 2018-10-07): JRA-123 - First task
? Choose time spent: (Use arrow keys)
❯ 4h
  3h
  2h
  1h
  
[ENTER]

$ worklog yesterday
? Choose task (from 2018-10-07): JRA-123 - First task
? Choose time spent: 4h
? Do you confirm to log 4h of work in task JRA-123? (Y/n)

[ENTER]

$ worklog yesterday
? Choose task (from 2018-10-07): JRA-123 - First task
? Choose time spent: 4h
? Do you confirm to log 4h of work in task JRA-123? Yes
Successfully logged 4h of work.
```

## Install

```
npm install jira-worklog -g
```

## Usage

```
worklog
worklog yesterday
worklog tuesday
worklog last thu
worklog 2000-01-01
```
*Note: default value for parameter is "today".*

## Configuration

Use `worklog` command for the first time and provide required info:
```
? Set project key (like "JRA") JRA
? Set base URL (like "jira.atlassian.net") jira.atlassian.net
? Login john.doe@example.com
? Password [hidden]
```
*Note: passwords are stored in Keychain.*

### Logout

To clear credentials and all other settings, use following command:
```
worklog reset
```

# License

MIT
