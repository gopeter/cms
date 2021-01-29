<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\records;

use craft\db\ActiveRecord;
use craft\db\Table;
use DateTime;

/**
 * Class AssetIndexData record.
 *
 * @property int $id ID
 * @property int|null $totalEntries The total amount of entries.
 * @property int|null $processedEntries The number of processed entries.
 * @property bool $cacheRemoteImages Whether remote images should be cached locally.
 * @property int|null $queueId If set, refers to the queue job id.
 * @property bool $actionRequired Whether action is required.
 * @property DateTime $dateUpdated Time when indexing session was last updated.
 * @property DateTime $dateCreated Time when indexing session was last updated.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.0.0
 */
class AssetIndexingSession extends ActiveRecord
{
    /**
     * @inheritdoc
     * @return string
     */
    public static function tableName(): string
    {
        return Table::ASSETINDEXINGSESSIONS;
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['totalEntries', 'processedEntries'], 'number', 'integerOnly' => true],
        ];
    }
}
