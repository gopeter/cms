<?php

namespace craft\fields\conditions;

use craft\base\conditions\BaseMultiSelectConditionRule;
use craft\fields\BaseOptionsField;
use craft\fields\data\MultiOptionsFieldData;
use craft\fields\data\OptionData;
use craft\fields\data\SingleOptionFieldData;
use Illuminate\Support\Collection;

/**
 * Options field condition rule.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.0.0
 */
class OptionsFieldConditionRule extends BaseMultiSelectConditionRule implements FieldConditionRuleInterface
{
    use FieldConditionRuleTrait;

    protected function options(): array
    {
        /** @var BaseOptionsField $field */
        $field = $this->field();
        return Collection::make($field->options)
            ->filter(fn(array $option) => (array_key_exists('value', $option) &&
                $option['value'] !== null &&
                $option['value'] !== '' &&
                $option['label'] !== null &&
                $option['label'] !== ''
            ))
            ->map(fn(array $option) => [
                'value' => $option['value'],
                'label' => $option['label'],
            ])
            ->all();
    }

    /**
     * @inheritdoc
     */
    protected function elementQueryParam(): ?array
    {
        return $this->paramValue();
    }

    /**
     * @inheritdoc
     */
    protected function matchFieldValue($value): bool
    {
        if (!$this->field() instanceof BaseOptionsField) {
            // No longer an options field
            return false;
        }

        if ($value instanceof MultiOptionsFieldData) {
            /** @phpstan-ignore-next-line */
            $value = array_map(fn(OptionData $option) => $option->value, (array)$value);
        } elseif ($value instanceof SingleOptionFieldData) {
            $value = $value->value;
        }

        return $this->matchValue($value);
    }
}
