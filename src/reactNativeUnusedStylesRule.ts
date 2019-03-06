import { Rules, RuleFailure } from "tslint";
import * as ts from "typescript";
import { tsquery } from "@phenomnomnominal/tsquery";

type Style = { name: string; node: ts.Node };
type StyleList = Style[];
type StyleDeclaration = { [s: string]: StyleList };

const FAILURE_MESSAGE = (objName: string, keyName: string) =>
  `Unused style declaration ${objName}.${keyName}`;

export class Rule extends Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): RuleFailure[] {
    // Collect.
    this.collectDeclarations(sourceFile);

    // Filter.
    this.filterExported(sourceFile);
    this.filterAccessed(sourceFile);

    // Walk through the remaining unused styles and raise errors.
    const ruleName = this.ruleName;
    let errors: RuleFailure[] = [];
    for (const styleName in this.declaredStyles) {
      this.declaredStyles[styleName].forEach(item => {
        errors.push(
          new RuleFailure(
            item.node.getSourceFile(),
            item.node.getStart(),
            item.node.getEnd(),
            FAILURE_MESSAGE(styleName, item.name),
            ruleName
          )
        );
      });
    }
    return errors;
  }

  // Storage for declared styles.
  private declaredStyles: StyleDeclaration = {};

  private collectDeclarations(node: ts.Node) {
    tsquery(node, "VariableDeclaration > Identifier").forEach(
      (node: ts.Node) => {
        // Ignore instantly exported declarations.
        if (tsquery(node.parent.parent.parent, "ExportKeyword").length == 1)
          return;
        const styleName = node.getText();
        if (
          tsquery(
            node.parent,
            "CallExpression > PropertyAccessExpression > Identifier[name=StyleSheet] ~ Identifier[name=create], CallExpression > PropertyAccessExpression > PropertyAccessExpression > Identifier[name=RN] ~ Identifier[name=StyleSheet]"
          ).length > 0
        ) {
          this.declaredStyles[styleName] = tsquery(
            node.parent,
            "CallExpression > ObjectLiteralExpression > PropertyAssignment > Identifier"
          ).map(node => {
            return { node, name: node.getText() };
          });
        }
      }
    );
  }

  private filterExported(node: ts.Node) {
    for (const styleName in this.declaredStyles) {
      this.declaredStyles[styleName].forEach((item, index) => {
        const q = `ExportAssignment Identifier[name=${styleName}]`;
        tsquery(node, q).forEach(() => {
          delete this.declaredStyles[styleName][index];
        });
      });
    }
  }

  private filterAccessed(node: ts.Node) {
    for (const styleName in this.declaredStyles) {
      // Filter styles accessed by [].
      if (
        tsquery(node, `ElementAccessExpression > Identifier[name=${styleName}]`)
          .length > 0
      ) {
        delete this.declaredStyles[styleName];
      } else {
        // Filter styles accessed as props.
        this.declaredStyles[styleName].forEach((item, index) => {
          tsquery(
            node,
            `PropertyAccessExpression > Identifier[name=${styleName}] ~ Identifier[name=${
              item.name
            }]`
          ).forEach(() => {
            delete this.declaredStyles[styleName][index];
          });
        });
      }
    }
  }
}
