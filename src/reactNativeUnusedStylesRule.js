"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var tslint_1 = require("tslint");
var tsquery_1 = require("@phenomnomnominal/tsquery");
var FAILURE_MESSAGE = function (objName, keyName) {
    return "Unused style declaration " + objName + "." + keyName;
};
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        // Storage for declared styles.
        _this.declaredStyles = {};
        return _this;
    }
    Rule.prototype.apply = function (sourceFile) {
        // Collect.
        this.collectDeclarations(sourceFile);
        // Filter.
        this.filterExported(sourceFile);
        this.filterAccessed(sourceFile);
        // Walk through the remaining unused styles and raise errors.
        var ruleName = this.ruleName;
        var errors = [];
        var _loop_1 = function (styleName) {
            this_1.declaredStyles[styleName].forEach(function (item) {
                errors.push(new tslint_1.RuleFailure(item.node.getSourceFile(), item.node.getStart(), item.node.getEnd(), FAILURE_MESSAGE(styleName, item.name), ruleName));
            });
        };
        var this_1 = this;
        for (var styleName in this.declaredStyles) {
            _loop_1(styleName);
        }
        return errors;
    };
    Rule.prototype.collectDeclarations = function (node) {
        var _this = this;
        tsquery_1.tsquery(node, "VariableDeclaration > Identifier").forEach(function (node) {
            // Ignore instantly exported declarations.
            if (tsquery_1.tsquery(node.parent.parent.parent, "ExportKeyword").length == 1)
                return;
            var styleName = node.getText();
            if (tsquery_1.tsquery(node.parent, "CallExpression > PropertyAccessExpression > Identifier[name=StyleSheet] ~ Identifier[name=create], CallExpression > PropertyAccessExpression > PropertyAccessExpression > Identifier[name=RN] ~ Identifier[name=StyleSheet]").length > 0) {
                _this.declaredStyles[styleName] = tsquery_1.tsquery(node.parent, "CallExpression > ObjectLiteralExpression > PropertyAssignment > Identifier").map(function (node) {
                    return { node: node, name: node.getText() };
                });
            }
        });
    };
    Rule.prototype.filterExported = function (node) {
        var _this = this;
        var _loop_2 = function (styleName) {
            this_2.declaredStyles[styleName].forEach(function (item, index) {
                var q = "ExportAssignment Identifier[name=" + styleName + "]";
                tsquery_1.tsquery(node, q).forEach(function () {
                    delete _this.declaredStyles[styleName][index];
                });
            });
        };
        var this_2 = this;
        for (var styleName in this.declaredStyles) {
            _loop_2(styleName);
        }
    };
    Rule.prototype.filterAccessed = function (node) {
        var _this = this;
        var _loop_3 = function (styleName) {
            // Filter styles accessed by [].
            if (tsquery_1.tsquery(node, "ElementAccessExpression > Identifier[name=" + styleName + "]")
                .length > 0) {
                delete this_3.declaredStyles[styleName];
            }
            else {
                // Filter styles accessed as props.
                this_3.declaredStyles[styleName].forEach(function (item, index) {
                    tsquery_1.tsquery(node, "PropertyAccessExpression > Identifier[name=" + styleName + "] ~ Identifier[name=" + item.name + "]").forEach(function () {
                        delete _this.declaredStyles[styleName][index];
                    });
                });
            }
        };
        var this_3 = this;
        for (var styleName in this.declaredStyles) {
            _loop_3(styleName);
        }
    };
    return Rule;
}(tslint_1.Rules.AbstractRule));
exports.Rule = Rule;
