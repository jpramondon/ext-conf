# EXT CONF 

External configuration files made easy. This component acts as a configuration file resolver to Typescript-written applications.
At this stage, the module can be considered stable, even though it could still receive some updates later (like a 'do not reload' switch or a 'work without files' behaviour).

## Primer

Basically, what it does is help you deal with an two-level priority-oriented pile of configuration files and variables and handle the fallbacks for you. So this module first resolves the configuration sources for you and then exposes them through a simplistic one-method API.

The first level settles the priority between the different sources of configuration. The second level defines a fallback strategy when using hierarchically organized configuration files.

By now, you should have guessed that external configuration means that your configuration items are initially not part of your project files.

## Deeper

### Priority rule #1

Configuration items come in different forms, formats and sources. They can either be:

- environment variables
- path variables
- properties in a json file

The *ext-conf* module defines a default strategy on to which sources should be treated first and prefered over the others. This is called the *precedence rule* and is based on the following priorities:
- *files*: configuration files always take precedence over any other type of configuration. Configuration files are simple key/value-formated json files like the following:

```json
{
 "prop1": "value1",
 "prop2": "value2"
}
```

- *argv*: next on the priority list are the one provided on the command line, just like the following:

```bash
> prop1=argvValue1 prop2=argvValue2 prop3=argvValue3 npm start
```

- *environment variables*: eventually, configuration items can be passed to *ext-conf* from the command line, so the latter can expose them along the ones from files or command line. Depending on your operating system, environment variables are not always set the same way. For the exemple, you may set new environment variables using the following command:

```bash
> export prop1=envVarValue1 prop4=envVarValue4
```

From the previous examples, given an application that would use all 3 forms of configuration, it would have access to the consolidated configuration key/value pairs through *ext-conf* :

- prop1/value1
- prop2/value2
- prop3/argvValue3
- prop4/envVarValue4

### Priority rule #2

The second priority rule applies only when using the *config.json* configuration files. It can be viewed as a simple way to define multiple levels of configuration: from the largely loosely defined one containing generic configuration applicable on a wide range of situations, to the most specific and exhaustive one defining precisely every little bits of configuration depending on the environment an application should be run. 

This gradually growing precision is based on a hierarchy of folders: the deeper the file, the more specific the configuration. The module tries a configuration file resolution for the highest level of precision possible at initialization phase using required environment variables (more on this in the Config section). Then, if not previously succesful, the next 2 resolutions are attempted in the parent folders.

For example, imagine your application's name is *myApp* in version *1.0.0* (as of your *package.json*). The *config.json* that will be exposed by *ext-conf* will be resolved within these steps:

- the first resolution attempt happens on the *[APP_CONF_PATH]/myApp-v1]/[APP_ENV]/config.json* file. If this file is found, the resolution process is stopped and the configuration items are said to be both application and environment specific.

```
-[APP_CONF_PATH]
    |-myApp-v1
        |-[APP_ENV]
            -config.json  <- resolved
        |-config.json
    |-config.json
```

- the second resolution attempt is performed on the *[APP_CONF_PATH]/myApp-v1]/config.json* file. Again if this file is found, the resolution process is stopped, but the configuration items are said to be application specific only.

```
-[APP_CONF_PATH]
    |-myApp-v1
        |-[APP_ENV]
            -config.json
        |-config.json  <- resolved
    |-config.json
```

- the final resolution attempt falls back to the *[APP_CONF_PATH]/config.json* file. When falling back to this file, the configuration items can only be qualified as generic.

```
-[APP_CONF_PATH]
    |-myApp-v1
        |-[APP_ENV]
            -config.json
        |-config.json
    |-config.json  <- resolved
```

*Note: the module only uses the major version of the application for which it's a dependency (here '1' in the example)*

# Technical infos

The module is based on the following libraries: 
- nconf handles one of the 2 priority levels as it does the priorization between files, argvs and environment variables
- winston as this module's logger

#How to install and use

## Installation

Just either add the component to your *package.json* file (recommended way) or issue an ```npm install``` command.

The *package.json* way:

```json
{
    ...
    "dependencies": {
        ...
        "@gearedminds/ext-conf" : version
        ...
    }
    ...
}
```

The manual installation way (some say preferred way ;) ):

```bash
> npm install @gearedminds/ext-conf
```

## Usage

### Config

Once installed, *ext-conf* requires 2 environment variables to work properly:

- `APP_CONF_PATH` is a path that leads to the root folder shared by all the applications to store their hierarchally-orentied configuration files
- `APP_ENV` is the kind of environment the application is going to be runned on (ie 'DEV', ... , 'PROD')

When combined together, these 2 environment variables' value form a path that help resolving where the application's configuration file is located.

### Code

Eventually, the module is ready to be used in your code. This is a simple 2-step job:

- initialize the configuration object that will be exposed :

```typescript
...
import {Config} from 'ext-conf';
...

    {
        ...
        Config.init();
        ...
    }

```

- enjoy *ext-conf*'s single method to access the configuration items:

```typescript
...
import {Config} from 'ext-conf';
...

    {
        ...
        let prop1 = Config.getConfItem('prop1');
        ...
    }

```

### Special behaviour

The module sports an auto-reload feature which updates the exposed configuration items with the latest from the file. Put differently, the content of the resolved *config.json* file can be changed anytime at runtime as it will eventually and regularly be reloaded using this strategy:

- by default, the resolved file is reloaded every 5 minutes
- if a *confReloadDelay* property is found (like in the following example), then it's used as the time (in milliseconds) between 2 configuration reloads

```json
{
    ...
    "confReloadDelay": 30000,
    ...
}
```

You may want to disable auto-reloading by setting this value to -1.

*Please note that only the initially resolved configuration file is reloaded. The module keeps track of that very file, so make sure you make changes in the correct file.*
