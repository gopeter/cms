<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace crafttests\unit\services;

use Craft;
use craft\base\Element;
use craft\db\Query;
use craft\db\Table;
use craft\elements\User;
use craft\errors\ElementNotFoundException;
use craft\events\RegisterUserPermissionsEvent;
use craft\events\UserEvent;
use craft\helpers\Db;
use craft\helpers\StringHelper;
use craft\mail\Message;
use craft\services\UserPermissions;
use craft\services\Users;
use craft\test\EventItem;
use craft\test\TestCase;
use crafttests\fixtures\GlobalSetFixture;
use crafttests\fixtures\SectionsFixture;
use crafttests\fixtures\SitesFixture;
use crafttests\fixtures\UserGroupsFixture;
use crafttests\fixtures\UsersFixture;
use crafttests\fixtures\VolumesFixture;
use UnitTester;
use yii\base\Exception;
use yii\base\InvalidArgumentException;
use DateTime;
use DateTimeZone;
use Throwable;
use ReflectionException;
use yii\db\Exception as YiiDbException;

/**
 * Unit tests for the User permissions service
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @author Global Network Group | Giel Tettelaar <giel@yellowflash.net>
 * @since 3.2
 */
class UserPermissionsTest extends TestCase
{
    // Public Properties
    // =========================================================================

    /**
     * @var UnitTester
     */
    protected $tester;

    /**
     * @var UserPermissions
     */
    protected $userPermissions;

    /**
     * @var User
     */
    protected $activeUser;

    // Public Methods
    // =========================================================================

    public function _fixtures() : array
    {
        return [
            'user-groups' => [
                'class' => UserGroupsFixture::class
            ],
            'users' => [
                'class' => UsersFixture::class
            ],
            'sites' => [
                'class' => SitesFixture::class
            ],
            'sections' => [
                'class' => SectionsFixture::class
            ],
            'globals' => [
                'class' => GlobalSetFixture::class,
            ],
            'volumes' => [
                'class' => VolumesFixture::class
            ]
        ];
    }

    // Tests
    // =========================================================================

    /**
     *
     */
    public function testGetAllPermissions()
    {
        $permissions = [];

        $this->tester->expectEvent(UserPermissions::class, UserPermissions::EVENT_REGISTER_PERMISSIONS, function() use (&$permissions) {
            $permissions = $this->userPermissions->getAllPermissions();
        }, RegisterUserPermissionsEvent::class);

        // Just check for the main keys.
        $this->assertArrayHasKey('General', $permissions);
        $this->assertArrayHasKey('Sites', $permissions);
        $this->assertArrayHasKey('Section - Single', $permissions);
        $this->assertArrayHasKey('Section - Test 1', $permissions);
        $this->assertArrayHasKey('Global Sets', $permissions);
        $this->assertArrayHasKey('Volume - Test volume 1', $permissions);
        $this->assertArrayHasKey('Utilities', $permissions);
    }

    /**
     * @throws \craft\errors\WrongEditionException
     */
    public function testDoesGroupHavePermission()
    {
        Craft::$app->setEdition(Craft::Pro);

        $this->assertFalse(
            $this->userPermissions->doesGroupHavePermission('1000', 'accessCp')
        );

        $this->userPermissions->saveGroupPermissions('1000', ['accessCp']);

        $this->assertTrue(
            $this->userPermissions->doesGroupHavePermission('1000', 'accessCp')
        );

        $this->assertFalse(
            $this->userPermissions->doesGroupHavePermission('1000', 'registerUsers')
        );
        $this->assertFalse(
            $this->userPermissions->doesGroupHavePermission('1000', 'invalidPermission')
        );

        // TODO: @Internal - these tests fail?!?
        $this->userPermissions->saveGroupPermissions('1000', ['assignUserPermissions', 'accessCp']);
        $this->assertFalse(
            $this->userPermissions->doesGroupHavePermission('1000', 'assignUserPermissions')
        );
        $this->assertTrue(
            $this->userPermissions->doesGroupHavePermission('1000', 'accessCp')
        );
    }

    public function testDoesUserHavePermission()
    {
        Craft::$app->setEdition(Craft::Pro);
        $this->userPermissions->saveGroupPermissions('1000', ['accessCp']);

        $user = User::find()
            ->admin(false)
            ->one();
        Craft::$app->getUsers()->assignUserToGroups($user->id, ['1000']);

        $this->assertTrue(
            $this->userPermissions->doesUserHavePermission($user->id, 'accessCp')
        );

        $this->assertFalse(
            $this->userPermissions->doesUserHavePermission($user->id, 'invalidPermission')
        );

        $this->userPermissions->saveUserPermissions($user->id, ['assignUserPermissions']);
        $this->assertTrue(
            $this->userPermissions->doesUserHavePermission($user->id, 'assignUserPermissions')
        );
        $this->assertFalse(
            $this->userPermissions->doesUserHavePermission($user->id, 'accessCp')
        );
    }

    // Protected Methods
    // =========================================================================

    /**
     * @inheritdoc
     */
    protected function _before()
    {
        parent::_before();

        $this->userPermissions = Craft::$app->getUserPermissions();
    }
}
