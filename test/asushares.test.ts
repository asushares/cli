// Author: Preston Lee

import path from 'path';
import { exec, ExecException } from 'child_process';
import { SharesCliVersion } from '../src/version';

describe('`version` subcommand', () => {

    test('should report correct package version', async () => {
        let result = (await cli(['-V'], __dirname)).stdout.trim();
        // console.log("RESULTS: ", result);
        // let json = JSON.parse(result);
        expect(result).toBe(SharesCliVersion.VERSION);
    });

});

describe('`server` subcommand', () => {

    // test('should fail without argument', async () => {
    //     let out = (await cli(['server'], __dirname));
    //     expect(out.stdout.length).toBe(0);
    //     expect(out.stderr.length).toBeGreaterThanOrEqual(0);
    //     expect(out.code).toBe(1);
    // });

    // test('should emit server status', async () => {
    //     let out = (await cli(['server', 'status'], __dirname));
    //     expect(out.stdout.length).toBeGreaterThanOrEqual(10);
    //     expect(out.stderr.length).toBe(0);
    //     expect(out.code).toBe(0);

    //     let correct = fs.readFileSync(AsuSharesAssetDirectory.PATH).toString();
    //     // console.log(correct);
    //     expect(fs.readFileSync(out.stdout.trim()).toString()).toBe(correct);
    // });

});

function cli(args: string[], cwd: string = __dirname) {
    return new Promise<{ code: number, error: ExecException | null, stdout: string, stderr: string }>(resolve => {
        exec(`ts-node ${path.resolve('src/bin/asushares.ts')} ${args.join(' ')}`,
            { cwd },
            (error, stdout, stderr) => {
                resolve({
                    code: error && error.code ? error.code : 0,
                    error,
                    stdout,
                    stderr
                })
            })
    })
}
