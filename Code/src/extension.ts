/**
 * Comment Cleaner: плагин VS Code для удаления однострочных комментариев
 * (две косые черты) из файлов C++.
 *
 * Плагин состоит из двух частей:
 * - {@link activate} регистрирует команду и применяет правку к документу;
 * - {@link removeComments} содержит логику обработки текста.
 *
 */

import * as vscode from 'vscode';

/**
 * Удаляет из текста C++ все однострочные комментарии.
 *
 * Функция один раз проходит по тексту слева направо и копирует символы
 * в результат. Двойная косая черта считается комментарием только в обычном
 * коде. Внутри строкового литерала и блочного комментария текст копируется
 * без изменений.
 *
 * Ограничения: не поддерживаются сырые строки и символьные литералы.
 *
 * @param text - исходный текст C++ файла
 * @returns тот же текст без однострочных комментариев
 *
 * @example
 * ```ts
 * removeComments('int a = 1; // счётчик');
 * // вернёт 'int a = 1; '
 * ```
 */

function removeComments(text: string): string {
	let result: string = '';
  	let i = 0;
	while (i < text.length) {
    	const c = text[i];
		if (i == text.length - 1) {
			result += c;
			break;
		}
		const next = text[i + 1];
		let prev = '\n';
		if (i > 0) prev = text[i - 1];
    	if (c === '/' && next === '/') {
      		//пропускается всё до конца строки
      		while (i < text.length && text[i] !== '\n') {
        		i++;
      		}
			if (text.length === i) {
				break;
			}
			if (prev == '\n') {
				i++;
				continue;
			} else {
				result += text[i];
				i++;
				continue;
			}
			continue;
    	}
		if (c === '/' && next === '*') {
      		// блочный комментарий остается
      		let end = text.indexOf('*/', i + 2);
      		end = end === -1 ? text.length : end + 2;
      		result += text.slice(i, end);
      		i = end;
			continue;
		}
		if (c === '"') {
			// строки копируются целиком
			let end = text.indexOf('"', i + 1);
			if (end == -1) end = text.length;
			result += text.slice(i, end);
			i = end;
		} else {
			result += c;
			i++;
		}
  }
  return result;
}

/**
 * Точка входа плагина. VS Code вызывает её при первом запуске команды.
 *
 * Регистрирует команду `commentCleaner.remove`. При вызове команда
 * проверяет, что открыт C++ файл, удаляет комментарии и заменяет текст
 * документа одной правкой (откатывается одним Ctrl+Z).
 *
 * @param context - контекст плагина; в нём хранятся подписки,
 *                  которые VS Code освобождает при выключении плагина
 */

export function activate(context: vscode.ExtensionContext) {
  	const command = vscode.commands.registerCommand('commentCleaner.remove', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		if (editor.document.languageId !== 'cpp') {
			vscode.window.showWarningMessage('Плагин работает только с C++ файлами.');
			return;
		}

		const text = editor.document.getText();
		const newText = removeComments(text);
		const all = new vscode.Range(
			editor.document.positionAt(0),
			editor.document.positionAt(text.length)
		);
		editor.edit(builder => builder.replace(all, newText));
  });

  context.subscriptions.push(command);
}

/**
 * Вызывается при выключении плагина. Освобождать нечего:
 * подписки из `context.subscriptions` VS Code очищает сам.
 */

export function deactivate() {}