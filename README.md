# Cloud Build Framework

Cloud Build Framework is a tool to build Unreal Engine games and custom versions of Unreal Engine using a simple JSON-based configuration file.

## Building a custom version of Unreal Engine 4

Clone the Cloud Build Framework repository and add a `config.json` file to the repository folder, with content similar to the following:

```
{
  "gulp-task": "build-ue4-custom",
  "build-id": "1",
  "branch": "4.20.3-release",
  "source": "git@github.com:EpicGames/UnrealEngine",
  "options": {
    "WithWin64": "true",
    "WithWin32": "false",
    "WithMac": "false",
    "WithAndroid": "false",
    "WithLinux": "true",
    "WithDDC": "false"
  }
}
```

Then run:

```
yarn
yarn start
```

Notable configuration options are:

- `gulp-task`: Change the Gulp task that is executed inside `gulpfile.ts`. You can leave this as the default of `build-ue4-custom` to build a custom version of UE4.
- `build-id`: The build subdirectory where the engine code and built artifacts are stored. If you leave this as the same ID across builds, then the intermediate files will be re-used for further invocations.
- `branch`: The branch or tag to clone from the source repository.
- `source`: The source Git URL to clone Unreal Engine 4 from. You can change this from the default if you want to use your own fork.
- `options`: A map of options that will apply to `InstalledEngineBuild.xml`.

## License

```
MIT License

Copyright (c) 2018 Redpoint Games Pty Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
