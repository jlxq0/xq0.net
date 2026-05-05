jQuery(document).ready(function($) {

    // ---------- countdown (108-second Lost timer) ----------
    var COUNTDOWN_START = 108;
    var countdown = COUNTDOWN_START;
    var countdownInterval = null;
    var systemFailed = false;

    function fmt(n) { return n < 10 ? '0' + n : '' + n; }

    function renderCountdown() {
        var m = Math.floor(countdown / 60);
        var s = countdown % 60;
        $('#countdown').text(fmt(m) + ':' + fmt(s));
        if (countdown <= 30 && !systemFailed) {
            $('#countdown').addClass('warning');
        } else {
            $('#countdown').removeClass('warning');
        }
    }

    function startCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        renderCountdown();
        countdownInterval = setInterval(function() {
            if (systemFailed) return;
            countdown--;
            renderCountdown();
            if (countdown <= 0) systemFailure();
        }, 1000);
    }

    function systemFailure() {
        systemFailed = true;
        $('body').addClass('system-failure');
        if (window._term) {
            window._term.echo('');
            window._term.echo('!! SYSTEM FAILURE !!');
            window._term.echo('Enter the numbers to restore.');
        }
    }

    function resetCountdown() {
        countdown = COUNTDOWN_START;
        systemFailed = false;
        $('body').removeClass('system-failure');
        $('#countdown').removeClass('warning');
        renderCountdown();
    }

    // ---------- lost quotes ----------
    var QUOTES = [
        '"We have to go back!" — Jack',
        '"Don\'t tell me what I can\'t do." — Locke',
        '"Live together, die alone." — Jack',
        '"See you in another life, brotha." — Desmond',
        '"The numbers are bad." — Hurley',
        '"Whatever happened, happened." — Faraday',
        '"Not Penny\'s boat." — Charlie',
        '"I\'m a complex guy, sweetheart." — Sawyer',
        '"You all everybody." — Drive Shaft',
        '"4 8 15 16 23 42." — The Numbers'
    ];
    function randomQuote() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }

    // ---------- whispers (jungle easter egg) ----------
    var WHISPERS = [
        '...stay with me...',
        '...behind you...',
        '...don\'t look...',
        '...help us...',
        '...not yet...',
        '...the others...',
        '...listen...',
        '...we are still here...'
    ];

    // ---------- about ----------
    var ABOUT = [
        'Julian Lindner — Singapore.',
        'Hanso Pte Ltd: Microsoft 365 + AI consulting.',
        'Side projects, photography, woodworking, mechanical keyboards.',
        '',
        'Type "contact" for ways to reach me, or "projects" for what I make.'
    ].join('\n');

    // ---------- projects ----------
    var PROJECTS = [
        ['Hanso',                  'https://hanso.group',          'Microsoft 365 + AI consulting'],
        ['Kampong Social',         'https://www.kampong.social',   'fediverse / community'],
        ['Lenno',                  'https://www.lenno.ai',          'AI · closed beta'],
        ['Outa',                   'https://www.outa.app',          'meditation'],
        ['Sleepless in Singapore', 'https://www.sleepless.sg',      'podcast'],
        ['Locolust',               'https://www.locolust.com',      'travel blog'],
        ['Yuzu',                   'https://github.com/jlxq0/yuzu', 'anti-censorship tunnel · OSS']
    ];

    // ---------- dharma stations ----------
    var STATIONS = {
        'swan':         'Station 3 — The Swan. Push the button every 108 minutes. Don\'t forget.',
        'pearl':        'Station 5 — The Pearl. The button does nothing. Or does it?',
        'arrow':        'Station 2 — The Arrow. DHARMA defense and intelligence.',
        'flame':        'Station 4 — The Flame. Communications hub.',
        'orchid':       'Station 6 — The Orchid. Time and space, but mostly trouble.',
        'hydra':        'Station 7 — The Hydra. They keep the polar bears here.',
        'looking glass':'Station 8 — Looking Glass. Underwater. Not Penny\'s boat.',
        'tempest':      'Station — The Tempest. Toxic gas. Don\'t inhale.'
    };

    // ---------- themes ----------
    var THEMES = ['dharma', 'matrix', 'amber', 'c64'];
    function setTheme(name, term) {
        if ($.inArray(name, THEMES) === -1) {
            term.echo('Unknown theme. Available: ' + THEMES.join(', '));
            return;
        }
        var body = $('body');
        $.each(THEMES, function(i, t) { body.removeClass('theme-' + t); });
        body.addClass('theme-' + name);
        term.echo('Theme set to ' + name + '.');
    }

    // ---------- mastodon posts ----------
    function loadPosts(term) {
        term.echo('Fetching last 5 toots from mastodon.kampong.social...');
        $.ajax({
            url: 'https://mastodon.kampong.social/api/v1/accounts/lookup',
            data: { acct: 'julian' },
            dataType: 'json'
        }).done(function(account) {
            $.ajax({
                url: 'https://mastodon.kampong.social/api/v1/accounts/' + account.id + '/statuses',
                data: { limit: 5, exclude_replies: true, exclude_reblogs: true },
                dataType: 'json'
            }).done(function(statuses) {
                term.echo('');
                if (!statuses.length) { term.echo('(no public posts found)'); return; }
                $.each(statuses, function(i, s) {
                    var text = $('<div>').html(s.content).text();
                    var when = new Date(s.created_at).toISOString().slice(0, 10);
                    term.echo('[' + when + '] ' + text);
                    term.echo('  ' + s.url);
                    term.echo('');
                });
            }).fail(function() {
                term.echo('Could not load statuses.');
            });
        }).fail(function() {
            term.echo('Could not look up account.');
        });
    }

    // ---------- known commands (for tab completion) ----------
    var COMMANDS = ['help', 'contact', 'about', 'whoami', 'now', 'posts', 'projects', 'theme', 'jungle', 'clear'];
    var THEME_COMMANDS = $.map(THEMES, function(t) { return 'theme ' + t; });
    var COMPLETIONS = COMMANDS.concat(THEME_COMMANDS);

    // ---------- terminal ----------
    var term = $('#term').terminal(function(command, term) {
        var cmd = command.trim();
        var lower = cmd.toLowerCase();

        // ---- the numbers (always wins, also restores from system failure) ----
        if (cmd === '4 8 15 16 23 42') {
            if (systemFailed) {
                term.echo('System restored.');
            } else {
                term.echo("I knew you'd try that. ;-)");
                term.echo('Countdown reset.');
            }
            resetCountdown();
            return;
        }

        // ---- core commands ----
        if (lower === 'help' || lower === '?') {
            term.echo('Commands:');
            term.echo('  contact   — how to reach me');
            term.echo('  about     — short bio (alias: whoami)');
            term.echo('  projects  — things I work on');
            term.echo('  now       — current local time + a quote');
            term.echo('  posts     — last 5 Mastodon posts');
            term.echo('  theme X   — switch theme: ' + THEMES.join(', '));
            term.echo('  clear     — clear the screen');
            term.echo('');
            term.echo('Some things are hidden. Tab completes; arrow keys recall history.');
            return;
        }

        if (lower === 'contact') {
            // Matrix URL uses %3A instead of ":" so the autolinker doesn't
            // truncate at the colon. matrix.to accepts both forms.
            term.echo(
                'Mail:         julian@lindner.earth\n' +
                'Mastodon:     https://mastodon.kampong.social/@julian\n' +
                'Matrix:       https://matrix.to/#/@julian%3Akampong.social\n' +
                'Instagram:    https://instagram.com/jlxq0\n' +
                '500px:        https://500px.com/jlxq0\n' +
                'Speakerdeck:  https://speakerdeck.com/jlxq0\n' +
                'Github:       https://github.com/jlxq0'
            );
            return;
        }

        if (lower === 'about' || lower === 'whoami') {
            term.echo(ABOUT);
            return;
        }

        if (lower === 'now') {
            var d = new Date();
            term.echo(d.toString());
            term.echo('');
            term.echo(randomQuote());
            return;
        }

        if (lower === 'posts') {
            loadPosts(term);
            return;
        }

        if (lower === 'projects') {
            $.each(PROJECTS, function(i, p) {
                var label = (p[0] + '                        ').substr(0, 24);
                term.echo(label + p[1] + '   — ' + p[2]);
            });
            return;
        }

        if (lower.indexOf('theme') === 0) {
            var parts = cmd.split(/\s+/);
            if (parts.length === 1) {
                term.echo('Available themes: ' + THEMES.join(', '));
                term.echo('Use: theme <name>');
            } else {
                setTheme(parts[1].toLowerCase(), term);
            }
            return;
        }

        if (lower === 'jungle') {
            term.echo('');
            $.each(WHISPERS, function(i, w) {
                setTimeout(function() { term.echo(w); }, i * 600);
            });
            return;
        }

        if (lower === 'clear' || lower === 'cls') {
            term.clear();
            return;
        }

        // ---- shell-ish aliases & jokes ----
        if (lower === 'ls' || lower === 'll' || lower === 'la' || lower === 'dir') {
            term.echo('cv.pdf            numbers.dat       please-execute');
            term.echo('readme.txt        secrets.enc       you-found-me.txt');
            return;
        }

        if (lower === 'pwd')                                     { term.echo('/island'); return; }
        if (lower === 'whoami' || lower === 'who am i')          { term.echo(ABOUT); return; }
        if (lower === 'who')                                     { term.echo('Just you. And the Others.'); return; }
        if (lower === 'date' || lower === 'time')                { term.echo(new Date().toString()); return; }
        if (lower === 'uptime')                                  { term.echo('up since 2014. mostly.'); return; }
        if (lower === 'history')                                 { term.echo('Use the up arrow.'); return; }
        if (lower === 'exit' || lower === 'quit' || lower === 'logout' || lower === 'q' || lower === ':q' || lower === ':q!' || lower === ':wq') {
            term.echo("Nice try. You can't leave.");
            return;
        }
        if (startsWord(lower, 'echo')) {
            term.echo(cmd.length > 5 ? cmd.substr(5) : '');
            return;
        }
        if (startsWord(lower, 'which') || startsWord(lower, 'whereis')) {
            term.echo('/usr/local/bin/' + (cmd.split(/\s+/)[1] || '?'));
            return;
        }
        if (lower === 'top' || lower === 'htop' || lower === 'ps') {
            term.echo('PID  USER     COMMAND');
            term.echo('  1  julian   /sbin/init');
            term.echo(' 42  julian   contemplating');
            term.echo('108  julian   pushing the button');
            return;
        }

        // ---- hidden easter eggs ----
        if (STATIONS.hasOwnProperty(lower)) {
            term.echo(STATIONS[lower]);
            return;
        }

        // helper: matches "word" or "word <anything>"
        function startsWord(s, w) { return s === w || s.indexOf(w + ' ') === 0; }

        // ---- sandwich (xkcd) — must come before generic sudo handler ----
        if (lower === 'sudo make me a sandwich') { term.echo('Okay.'); return; }
        if (lower === 'make me a sandwich')      { term.echo('What? Make it yourself.'); return; }

        if (startsWord(lower, 'sudo')) {
            term.echo('Permission denied: DHARMA security clearance required.');
            return;
        }

        if (startsWord(lower, 'rm')) {
            term.echo("I'm afraid I can't let you do that, Dave.");
            return;
        }

        if (lower === '42') {
            term.echo('The Answer to the Ultimate Question of Life, the Universe, and Everything.');
            return;
        }

        if (lower === 'coffee') {
            term.echo("418 — I'm a teapot.");
            return;
        }

        if (lower === 'tea') {
            term.echo('Brewing... ☕');
            return;
        }

        if (lower === 'hatch' || lower === 'button') {
            term.echo('You have to push the button. Enter the numbers.');
            return;
        }

        if (lower === 'island') {
            term.echo('"We have to go back!" — Jack');
            return;
        }

        if (lower === 'polar bear' || lower === 'polarbear') {
            term.echo("What's a polar bear doing in the jungle?");
            return;
        }

        if (startsWord(lower, 'vim') || startsWord(lower, 'nano') || startsWord(lower, 'emacs')) {
            term.echo('There is no editor here. Just stay a while.');
            return;
        }

        if (startsWord(lower, 'ssh')) {
            term.echo("Connection refused. (You can't get there from here.)");
            return;
        }

        if (startsWord(lower, 'ping')) {
            term.echo('ping: cannot resolve host.');
            return;
        }

        if (startsWord(lower, 'git')) {
            term.echo('fatal: not a git repository.');
            return;
        }

        if (startsWord(lower, 'man')) {
            var manTarget = cmd.length > 4 ? cmd.substr(4) : '?';
            term.echo('No manual entry for ' + manTarget + '.');
            return;
        }

        if (startsWord(lower, 'decrypt') || startsWord(lower, 'crack') || startsWord(lower, 'unlock')) {
            term.echo("I'm afraid that's classified.");
            return;
        }

        if (lower.charAt(0) === '.' && lower.charAt(1) === '/') {
            term.echo('Permission denied: not executable.');
            return;
        }

        if (lower === 'hello' || lower === 'hi' || lower === 'hey') {
            term.echo("Hi. Type 'help' if you're new here.");
            return;
        }

        if (lower === 'cat numbers.dat') { term.echo('4 8 15 16 23 42'); return; }
        if (lower === 'cat secrets.enc') { term.echo('Decryption failed. (Try harder.)'); return; }
        if (lower === 'cat please-execute') { term.echo('Enter the numbers.'); return; }
        if (lower === 'cat readme.txt') { term.echo("Type 'help'."); return; }
        if (lower === 'cat you-found-me.txt') { term.echo("Well done. There's nothing else to find here. Probably."); return; }
        if (lower === 'cat cv.pdf') { term.echo("(binary file — won't print)"); return; }

        if (lower.indexOf('cat ') === 0) {
            term.echo("cat: " + cmd.substr(4) + ": No such file.");
            return;
        }

        term.echo("Unknown command (try 'help').");
    }, {
        prompt: '>: ',
        name: 'lindner',
        greetings: null,
        completion: COMPLETIONS,
        history: true
    });

    window._term = term;
    startCountdown();

    // ---------- konami code: ↑ ↑ ↓ ↓ ← → ← → b a ----------
    var KONAMI = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    var konamiIdx = 0;
    $(document).on('keydown', function(e) {
        var k = e.which || e.keyCode;
        if (k === KONAMI[konamiIdx]) {
            konamiIdx++;
            if (konamiIdx === KONAMI.length) {
                konamiIdx = 0;
                if (window._term) {
                    window._term.echo('');
                    window._term.echo('++ KONAMI CODE ACCEPTED ++');
                    window._term.echo('30 lives granted. Use them wisely.');
                }
            }
        } else {
            konamiIdx = (k === KONAMI[0]) ? 1 : 0;
        }
    });
});
