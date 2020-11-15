import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {SDKClient} from './util';
import { assert } from 'console';

export async function yuqueClone() {
    let user = await SDKClient.users.get();
    let repos: {name: string, namespace: string} [] = await SDKClient.repos.list({user: user.login, data: {}});
    let nameOfRepos = [];
    for (let i = 0; i < repos.length; ++ i) {
        nameOfRepos.push(
            {
                label: repos[i].name,
                namespace: repos[i].namespace
            }
        );
    }
    
    const choice = await vscode.window.showQuickPick(nameOfRepos);
    await updateOrCreateTOC(choice.namespace);
    vscode.window.showInformationMessage(`${choice.label} is saved into TOC.yaml successfully`);
}

export async function updateOrCreateTOC(namespace: string) {
    const repoInfo = await SDKClient.repos.get({namespace: namespace, data: {}});
    console.log(repoInfo);
    let folders = vscode.workspace.workspaceFolders;
    if (folders.length === 1) {
        let folderPath = folders[0].uri.fsPath;
        let tocPath = path.join(folderPath, 'TOC.yaml');
        let tocVal = yaml.safeLoad(repoInfo.toc_yml, 'utf-8');
        if (tocVal === null) {
            tocVal = [{type: 'META', namespace: namespace}];
        } else {
            assert(tocVal[0].type === 'META');
            tocVal[0].namespace = namespace;
        }

        console.log(repoInfo.toc_yml);
        fs.writeFileSync(tocPath, yaml.safeDump(tocVal), {});
    } else {
        vscode.window.showErrorMessage('YuqueCli is not supported for multi workspaces');
    }
}