# Flu Mapped

Eventually might be a choropleth of volunteer numbers for the flu study, if such data can be displayed.

Postcode info nabbed from [here](https://github.com/roblascelles/uk-postcode-map).

# Running It

Clone the project and then use an HTTP server of your choice to service it up. It won't work as a `file://` protocol as
there are requests made for data files.

For example:

```sh
git clone git@github.com:chooban/flumapped.git
python -m SimpleHTTPServer
```

Now open a browser and load this page: http://localhost:8000
